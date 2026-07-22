import '../loading-bar/loading-bar.js';
import { WebComponent } from '../../core/index.js';
import { globalState } from '../../core/state/globalState.js';
// Minimum time the boot screen stays on screen so the V slide-in (≈1.1s)
// has time to play out even when the app boots faster than that. Anything
// less and the user sees the legs mid-flight before the screen vanishes.
const MIN_VISIBLE_MS = 1800;
/**
 * Full-viewport splash. Append first; dismiss only after the app is fully
 * rendered + appended (see modules/boot-pipeline.js). `dismiss()` is async and
 * resolves after the element is removed and `bootComplete` is set.
 */
export class BootScreen extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bootScreen: './boot-screen.css',
	};
	static state = {
		heading: '',
		subheading: '',
		extraSubheading: '',
		logo: '',
		barState: {
			indeterminate: true,
			label: '',
		},
	};
	// `logo` is a caller-supplied SVG markup string — declare it html-kind so
	// the spot injects it as markup, not escaped text.
	static properties = {
		logo: {
			kind: 'html',
		},
	};
	shownAt = 0;
	closing = false;
	#dismissPromise = null;
	#minVisibleResolve = null;
	onMount() {
		this.shownAt = performance.now();
	}
	/**
	 * Update the loading-bar label without replacing the whole barState object.
	 * @param {string} label
	 */
	setStatus(label) {
		if (!label) {
			return;
		}
		this.state.barState.label = label;
	}
	/**
	 * Begin dismiss: honor min-visible, fade out, remove, set bootComplete.
	 * Idempotent — concurrent callers share one promise.
	 * @returns {Promise<void>}
	 */
	dismiss() {
		if (this.#dismissPromise) {
			return this.#dismissPromise;
		}
		this.#dismissPromise = this.runDismiss();
		return this.#dismissPromise;
	}
	async runDismiss() {
		if (this.closing) {
			return;
		}
		this.closing = true;
		const elapsed = performance.now() - this.shownAt;
		const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
		if (wait > 0) {
			await this.waitMinVisible(wait);
		}
		await this.closeNow();
	}
	waitMinVisible(ms) {
		return new Promise((resolve) => {
			this.#minVisibleResolve = resolve;
			this.setTimeout(BootScreen.onMinVisibleTimer, ms);
		});
	}
	static onMinVisibleTimer(component) {
		const resolve = component.#minVisibleResolve;
		component.#minVisibleResolve = null;
		resolve?.();
	}
	async closeNow() {
		// `animateOut` adds `is-closing` and awaits the real opacity transition (no
		// hardcoded duration to drift from the CSS), then we tear the splash down.
		await this.animateOut({
			target: this.refs.splash,
			className: 'is-closing',
		});
		this.remove();
		// Signal to gated UI (e.g. the wallet-onboarding modal) that it's safe to
		// surface itself — anything watching this flag stays quiet until the splash
		// is fully torn down.
		globalState.set({
			bootComplete: true,
		});
	}
	render() {
		this.html`
			<div #splash class="boot-screen" role="status" aria-live="polite">
				<div class="bs-stage">
					<div class="bs-glow"></div>
					${this.bind('logo')}
					<div class="bs-titles">
						<div class="bs-title">${this.state.heading}</div>
						<div class="bs-subtitle">${this.state.subheading}</div>
					</div>
					<ui-loading-bar .state=${this.state.barState}></ui-loading-bar>
					<div class="bs-subtitle">${this.state.extraSubheading}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('boot-screen', BootScreen);
