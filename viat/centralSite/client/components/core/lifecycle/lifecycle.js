import { defaultLogger } from '../debug/logger.js';
import { Perf } from '../debug/perf.js';
import {
	registerChild, trackComponent, unregisterChild, untrackComponent,
} from '../dom/children.js';
import { register, unregister } from '../dom/registry.js';
import { sweepHotkeyEntries } from '../hotkeys/hotkeys.js';
import { unlinkStateCarrier } from '../state/state.js';
import {
	clearRealmUnsubs,
	clearUnsubs,
	hasAnyKey,
	isPromiseLike,
	isShadowRoot,
	queueAsyncError,
	runHook,
} from '../utilities.js';
import { PHASE } from './phase.js';
/**
 * Lifecycle-promise key vocabulary. The single source of truth for every
 * `lifecycle.whenX` key passed as a string argument to awaitChildren.
 * Dot-notation accesses (`x.lifecycle.whenLive`) keep the idiomatic property
 * form — they resolve through the Lifecycle class's lazy getters
 * (lifecyclePromises.js), which also owns the fire/arm slot machinery.
 *
 * Deliberately NO `whenDisconnected`: disconnect is a RECURRING transition, and a
 * one-shot promise is the wrong primitive (it would have to be re-armed every
 * cycle — which was a footgun). Nothing consumed it. Observe disconnect via the
 * `onDisconnect` hook, `phase === 'disconnected'` / `isDisconnected`, or the
 * native `disconnectedCallback`.
 */
export const LIFECYCLE_PROMISE = Object.freeze({
	CONNECTED: 'whenConnected',
	RENDERED: 'whenRendered',
	MOUNTED: 'whenMounted',
	LIVE: 'whenLive',
	VISIBLE: 'whenVisible',
	DESTROYED: 'whenDestroyed',
});
function attachToParent(component, parentHost) {
	if (parentHost && parentHost.isWebComponent) {
		component.parentComponent = parentHost;
		registerChild(parentHost, component);
		return;
	}
	component.parentComponent = null;
}
function resolveParentHost(component) {
	const root = component.getRootNode();
	return isShadowRoot(root) ? root.host : component.parentElement;
}
/*
 * Generation-scoped settle for handleConnect. Self-clears pendingConnect only
 * when THIS connect attempt is still current — a reconnect that bumps
 * connectGeneration leaves the newer pendingConnect intact.
 */
async function settleConnect(component, generation) {
	try {
		await component.handleConnect();
	} catch (error) {
		queueAsyncError(error);
	}
	if (component.connectGeneration === generation) {
		component.pendingConnect = null;
	}
}
/*
 * Custom-element callback boundary — no try/catch wrapper. User hooks inside
 * the handlers are contained by runHook (→ 'lifecycleError' event) and the render
 * pipeline never rejects, so a rejection reaching these `.catch`es is a
 * framework invariant breach: queueAsyncError surfaces it as an uncaught
 * async error without taking down the DOM callback or the connect cycle.
 */
export function connectedCallback() {
	if (!this.firstRenderDone) {
		this.classList.add('mounting');
	}
	this.connectGeneration = (this.connectGeneration | 0) + 1;
	this.pendingConnect = settleConnect(this, this.connectGeneration);
}
export function connectedMoveCallback() {
	this.handleMove().catch(queueAsyncError);
}
export function disconnectedCallback() {
	this.handleDisconnect().catch(queueAsyncError);
}
export async function handleConnect() {
	const perfMark = Perf.mark('connect');
	register(this);
	/*
	 * Join the flat connected roster (the class-level search substrate) here,
	 * next to the id registry, so membership tracks the same connect/disconnect
	 * pair. Paired with untrackComponent in handleDisconnect.
	 */
	trackComponent(this);
	if (defaultLogger.debugOn) {
		defaultLogger.debug('connectedCallback', `${this.constructor.name}<${this.localName}>`);
	}
	attachToParent(this, resolveParentHost(this));
	/*
	 * AI-registry participation. Opt-in via the AI mixin, hence optional-chained
	 * (no-op when absent). Runs here — right after parent attach, before styles /
	 * onConnect / render — to preserve the timing of the former connectedCallback
	 * monkey-patch without wrapping the callback.
	 */
	this.aiRegister?.();
	/*
	 * `await this.applyStyles()` used to queue a microtask EVERY instance
	 * even when the styleMap was already populated (warm path, instances
	 * 2..N of the class — synchronous adoptedStyleSheets assign). For a
	 * 500-item list that was ~25ms of pure microtask overhead. runHook
	 * returns a non-thenable on the warm path (no await) and contains a
	 * sheet-load failure (→ 'lifecycleError' event) so the connect cycle still
	 * reaches render — style-less beats never-rendered.
	 */
	const stylesOutcome = runHook(this, 'applyStyles');
	if (isPromiseLike(stylesOutcome)) {
		await stylesOutcome;
	}
	/*
	 * Per-component theme sub-modules — adopt the active theme's rule sheet(s)
	 * BEFORE first paint (no FOUC), then hot-swap on `theme:change`. Near-free
	 * for a component with no `static themes` layer (cached empty layer list →
	 * returns null, no await); only themed components pay the sheet-load await.
	 */
	const themeOutcome = runHook(this, 'applyThemeStyles');
	if (isPromiseLike(themeOutcome)) {
		await themeOutcome;
	}
	/*
	 * Same pattern for `onConnect` — runHook skips an absent hook without
	 * allocating, so hookless components pay no microtask, and a throwing
	 * hook routes to the 'lifecycleError' event instead of aborting the connect.
	 */
	const connectOutcome = runHook(this, 'onConnect');
	if (isPromiseLike(connectOutcome)) {
		await connectOutcome;
	}
	this.phase = PHASE.CONNECTED;
	this.lifecycle.fireConnected();
	if (hasAnyKey(this.STATE)) {
		await this.updateView();
	} else {
		await this.renderView();
	}
	Perf.measure('connect', perfMark);
}
export async function handleMove() {
	if (defaultLogger.debugOn) {
		defaultLogger.debug('connectedMoveCallback', `${this.constructor.name}<${this.localName}>`);
	}
	const oldParent = this.parentComponent;
	unregisterChild(this);
	attachToParent(this, resolveParentHost(this));
	const moveOutcome = runHook(this, 'onMove', [oldParent, this.parentComponent]);
	if (isPromiseLike(moveOutcome)) {
		await moveOutcome;
	}
}
export async function handleDisconnect() {
	/*
	 * Leave the AI registry synchronously, before any await of pendingConnect, so
	 * rapid connect/disconnect churn (list recycling) never strands a detached
	 * component in the registry. Opt-in mixin, hence optional-chained.
	 */
	this.aiUnregister?.();
	/*
	 * Capture-await-recheck: a settled connect already cleared pendingConnect
	 * (sync teardown path — zero microtask). An in-flight connect is awaited;
	 * if a reconnect landed during the await, abort teardown of the LIVE element.
	 */
	const awaited = this.pendingConnect;
	if (awaited) {
		await awaited;
		if (this.isConnected) {
			return;
		}
	}
	this.pendingConnect = null;
	unregister(this);
	untrackComponent(this);
	if (defaultLogger.debugOn) {
		defaultLogger.debug('disconnectedCallback', `${this.constructor.name}<${this.localName}>`);
	}
	unregisterChild(this);
	this.parentComponent = null;
	this.uninstallObserver();
	this.disposeCollections();
	this.disposeLists();
	this.visibleFired = false;
	this.isIntersecting = false;
	this.isIntersected = false;
	this.isVisible = false;
	this.clearTimeouts();
	this.clearIntervals();
	this.stateUnsubs?.clear();
	unlinkStateCarrier(this);
	this.globalUnsubs?.clear();
	this.clearStoreObservers();
	this.clearDelegateListeners();
	sweepHotkeyEntries(this.hotkeyEntries);
	clearUnsubs(this.gestureUnsubs);
	this.clearInjectLinks();
	this.refsMap = null;
	this.refsProxy = null;
	this.cleanupTemplate();
	this.templateBuilt = false;
	this.firstRenderDone = false;
	clearRealmUnsubs(this.renderDepUnsubs);
	this.stateBus?.clearRenderDeps();
	this.clearEventListeners();
	this.resolveStrandedConnectCyclePromises();
	const disconnectOutcome = runHook(this, 'onDisconnect');
	if (isPromiseLike(disconnectOutcome)) {
		await disconnectOutcome;
	}
	this.phase = PHASE.DISCONNECTED;
	// @engram em:network/code/destroy-must-settle-the-lifecycle-slots-re-arm-is-only-for-a — both strand routes, and the reconnect invariant this must not break
	/*
	 * Re-arm ONLY for a cycle that can actually happen again. The re-arm resets
	 * the settled connect-cycle slots to PENDING so a RECONNECT hands out fresh
	 * promises — but on a destroy there is no next connect, so re-arming there
	 * left a post-destroy `whenConnected` read arming a deferred nothing would
	 * ever fire. handleDestroy owns the settle for this path.
	 */
	if (this.pendingDestroy) {
		await this.handleDestroy();
		return;
	}
	this.createConnectCyclePromises();
}
export async function handleDestroy() {
	const destroyOutcome = runHook(this, 'onDestroy');
	if (isPromiseLike(destroyOutcome)) {
		await destroyOutcome;
	}
	this.phase = PHASE.DESTROYED;
	/*
	 * Destroy is a terminal settle path — the always-settle contract has to hold
	 * here or an awaiter hangs forever. Covers the route that never touches
	 * handleDisconnect at all: `destroy()` on a never-connected element calls
	 * straight through, leaving slots that were never settled. Idempotent after a
	 * disconnect settle (an already-SETTLED slot re-settles to the same state).
	 */
	this.resolveStrandedConnectCyclePromises();
	this.lifecycle.fireDestroyed();
}
export function destroy() {
	if (this.phase === PHASE.DESTROYED) {
		return this.lifecycle.whenDestroyed;
	}
	this.pendingDestroy = true;
	if (this.isConnected) {
		this.remove();
	} else {
		this.handleDestroy().catch(queueAsyncError);
	}
	return this.lifecycle.whenDestroyed;
}
export function resolveStrandedConnectCyclePromises() {
	this.lifecycle.fireConnectCycle();
}
export function createConnectCyclePromises() {
	this.lifecycle.armConnectCycle();
}
