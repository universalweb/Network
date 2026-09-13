/*
 * Trackable app boot pipeline.
 *
 * Phases (strict order — each settles before the next starts unless noted):
 *   1. boot-mounted   — <boot-screen> is in the document and whenLive
 *   2. modules-loaded — dynamic imports for env / roots / plugins / AppView done
 *   3. plugins-ran    — runPlugins() finished
 *   4. app-ready      — AppView constructed + pre-rendered to whenLive (under splash)
 *   5. app-appended   — app is connected under body (preRender appends; marked explicitly)
 *   6. boot-dismissed — splash min-visible + fade-out + removed; bootComplete=true
 *
 * Race rules:
 * - Splash ALWAYS mounts first and is the only visible surface until phase 6.
 * - App modules load only after phase 1 (dynamic import — not static-blocked).
 * - Dismiss awaits BOTH app readiness AND the splash's own min-visible clock.
 * - phase / waitFor / onPhase let callers observe without racing internals.
 */
import { emitDelegate } from '../components/core/dom/delegate.js';
import { globalState } from '../components/core/state/globalState.js';
const PHASES = [
	'idle',
	'boot-mounted',
	'modules-loaded',
	'plugins-ran',
	'app-ready',
	'app-appended',
	'boot-dismissed',
];
function phaseIndex(phaseName) {
	return PHASES.indexOf(phaseName);
}
export class BootPipeline {
	phase = 'idle';
	bootScreen = null;
	app = null;
	error = null;
	#waiters = new Map();
	#started = false;
	/**
	 * @param {object} options
	 * @param {() => Promise<import('../components/global/boot-screen/boot-screen.js').BootScreen>} options.mountBoot
	 * Append + return a live boot-screen instance.
	 * @param {(pipeline: BootPipeline) => Promise<unknown>} options.loadApp
	 * Dynamic-import modules, run plugins, construct + preRender AppView.
	 * Must set `pipeline.app` before resolving (or return the app instance).
	 * @param {(label: string) => void} [options.onStatus] - Optional bar/status updates.
	 */
	constructor(options) {
		this.mountBoot = options.mountBoot;
		this.loadApp = options.loadApp;
		this.onStatus = options.onStatus;
	}
	get isComplete() {
		return this.phase === 'boot-dismissed';
	}
	/**
	 * Resolve when the pipeline reaches `phase` (or a later one). Immediate if already there.
	 * @param {string} phase
	 * @returns {Promise<string>}
	 */
	waitFor(phase) {
		if (phaseIndex(phase) < 0) {
			return Promise.reject(new Error(`[boot] unknown phase: ${phase}`));
		}
		if (phaseIndex(this.phase) >= phaseIndex(phase)) {
			return Promise.resolve(this.phase);
		}
		let bucket = this.#waiters.get(phase);
		if (!bucket) {
			bucket = [];
			this.#waiters.set(phase, bucket);
		}
		return new Promise((resolve, reject) => {
			bucket.push({
				resolve,
				reject,
			});
		});
	}
	#setPhase(next) {
		if (phaseIndex(next) < phaseIndex(this.phase)) {
			return;
		}
		this.phase = next;
		globalState.set({
			'boot.phase': next,
		});
		emitDelegate('boot:phase', {
			phase: next,
		});
		const phaseCount = PHASES.length;
		for (let index = 0; index < phaseCount; index++) {
			const phaseName = PHASES[index];
			if (phaseIndex(phaseName) > phaseIndex(next)) {
				break;
			}
			const bucket = this.#waiters.get(phaseName);
			if (!bucket) {
				continue;
			}
			this.#waiters.delete(phaseName);
			const waiterCount = bucket.length;
			for (let waiterIndex = 0; waiterIndex < waiterCount; waiterIndex++) {
				bucket[waiterIndex].resolve(next);
			}
		}
	}
	#fail(error) {
		this.error = error;
		emitDelegate('boot:error', {
			error,
			phase: this.phase,
		});
		const entries = this.#waiters.values();
		for (const bucket of entries) {
			const waiterCount = bucket.length;
			for (let waiterIndex = 0; waiterIndex < waiterCount; waiterIndex++) {
				bucket[waiterIndex].reject(error);
			}
		}
		this.#waiters.clear();
	}
	#status(label) {
		if (this.onStatus) {
			this.onStatus(label);
		}
		this.bootScreen?.setStatus?.(label);
	}
	/**
	 * Run the full pipeline once. Safe to call only once per page load.
	 * @returns {Promise<object>} The live AppView instance.
	 */
	async run() {
		if (this.#started) {
			return this.waitFor('boot-dismissed').then(() => {
				return this.app;
			});
		}
		this.#started = true;
		try {
			this.#status('Starting');
			const bootScreen = await this.mountBoot();
			this.bootScreen = bootScreen;
			if (bootScreen?.lifecycle?.whenLive) {
				await bootScreen.lifecycle.whenLive;
			}
			this.#setPhase('boot-mounted');
			this.#status('Loading modules');
			const appResult = await this.loadApp(this);
			if (appResult != null && this.app == null) {
				this.app = appResult;
			}
			if (!this.app) {
				throw new Error('[boot] loadApp did not produce an app instance');
			}
			// loadApp is expected to have advanced modules-loaded / plugins-ran /
			// app-ready / app-appended itself; fill any gaps so waiters settle.
			if (phaseIndex(this.phase) < phaseIndex('modules-loaded')) {
				this.#setPhase('modules-loaded');
			}
			if (phaseIndex(this.phase) < phaseIndex('plugins-ran')) {
				this.#setPhase('plugins-ran');
			}
			if (phaseIndex(this.phase) < phaseIndex('app-ready')) {
				this.#setPhase('app-ready');
			}
			if (phaseIndex(this.phase) < phaseIndex('app-appended')) {
				this.#setPhase('app-appended');
			}
			this.#status('Ready');
			// Splash owns min-visible + fade; only leaves after app is on the page.
			if (bootScreen?.dismiss) {
				await bootScreen.dismiss();
			}
			this.#setPhase('boot-dismissed');
			return this.app;
		} catch (error) {
			this.#fail(error);
			throw error;
		}
	}
	/** Mark an intermediate phase from loadApp (only forward). */
	mark(phase) {
		this.#setPhase(phase);
	}
}
export { PHASES as BOOT_PHASES };
