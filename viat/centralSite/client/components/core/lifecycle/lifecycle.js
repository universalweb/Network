import {
	assignPromisePair,
	clearRealmUnsubs,
	clearUnsubs,
	fireResolver,
	isShadowRoot,
} from '../utilities.js';
import { register, unregister } from '../dom/registry.js';
import { Logger } from '../debug/logger.js';
import { PHASE } from './phase.js';
import { Perf } from '../debug/perf.js';
import { registerChild } from '../dom/children.js';
import { sweepHotkeyEntries } from '../hotkeys/hotkeys.js';
/**
 * Lifecycle-promise key vocabulary. The single source of truth for every
 * `lifecycle.whenX` key passed as a string argument to fireResolver,
 * assignPromisePair, or awaitChildren. Dot-notation accesses (`x.lifecycle.whenLive`)
 * keep the idiomatic property form; renaming a key still requires touching
 * those, but at least every dynamic-key call site reads from one place.
 */
export const LIFECYCLE_PROMISE = Object.freeze({
	CONNECTED: 'whenConnected',
	RENDERED: 'whenRendered',
	MOUNTED: 'whenMounted',
	LIVE: 'whenLive',
	VISIBLE: 'whenVisible',
	DESTROYED: 'whenDestroyed',
});
/*
 * The forward connect-cycle promises: created on connect, re-armed after a
 * disconnect (so a reconnect / DOM move gets fresh ones), and resolved as
 * "stranded" if the element disconnects before the cycle completes (so awaiters
 * of whenLive/etc. on an early-detached element never hang). One array drives
 * both create + stranded-resolve since the sets are identical.
 *
 * Deliberately NO `whenDisconnected`: disconnect is a RECURRING transition, and a
 * one-shot promise is the wrong primitive (it would have to be re-armed every
 * cycle — which was a footgun). Nothing consumed it. Observe disconnect via the
 * `onDisconnect` hook, `phase === 'disconnected'` / `isDisconnected`, or the
 * native `disconnectedCallback`.
 */
const CONNECT_CYCLE_KEYS = [
	LIFECYCLE_PROMISE.CONNECTED,
	LIFECYCLE_PROMISE.RENDERED,
	LIFECYCLE_PROMISE.MOUNTED,
	LIFECYCLE_PROMISE.LIVE,
	LIFECYCLE_PROMISE.VISIBLE,
];
function attachToParent(component, parentHost) {
	if (parentHost && parentHost.isWebComponent) {
		component.parentComponent = parentHost;
		component.unregisterFromParent = registerChild(parentHost, component);
		return;
	}
	component.parentComponent = null;
}
function resolveParentHost(component) {
	const root = component.getRootNode();
	return isShadowRoot(root) ? root.host : component.parentElement;
}
function runLifecycleStep(component, handlerName, label) {
	return component[handlerName]().catch((error) => {
		Logger.error('WebComponent', `[${component.tagName}] ${label} error:`, error);
		component.onLifecycleError(error);
	});
}
export function connectedCallback() {
	if (!this.firstRenderDone) {
		this.classList.add('mounting');
	}
	this.pendingConnect = runLifecycleStep(this, 'handleConnect', 'Connected');
}
export function connectedMoveCallback() {
	runLifecycleStep(this, 'handleMove', 'Move');
}
export function disconnectedCallback() {
	runLifecycleStep(this, 'handleDisconnect', 'Disconnected');
}
export async function handleConnect() {
	const perfMark = Perf.mark('connect');
	register(this);
	if (Logger.debugOn) {
		Logger.debug('WebComponent', `[${this.tagName}] connectedCallback`);
	}
	attachToParent(this, resolveParentHost(this));
	/*
	 * `await this.applyStyles()` used to queue a microtask EVERY instance
	 * even when the styleMap was already populated (warm path, instances
	 * 2..N of the class — synchronous adoptedStyleSheets assign). For a
	 * 500-item list that was ~25ms of pure microtask overhead. Only await
	 * when applyStyles actually returns a promise.
	 */
	const stylesResult = this.applyStyles();
	if (stylesResult && typeof stylesResult.then === 'function') {
		await stylesResult;
	}
	/*
	 * Per-component theme sub-modules — adopt the active theme's rule sheet(s)
	 * BEFORE first paint (no FOUC), then hot-swap on `theme:change`. Near-free
	 * for a component with no `static themes` layer (cached empty layer list →
	 * returns null, no await); only themed components pay the sheet-load await.
	 */
	const themeResult = this.applyThemeStyles();
	if (themeResult && typeof themeResult.then === 'function') {
		await themeResult;
	}
	/**
	 * Same pattern for `onConnect` — components without an `onConnect`
	 * hook used to pay one microtask for `await undefined`. Only await if
	 * the hook exists AND its return is a thenable.
	 */
	if (this.onConnect) {
		const connectResult = this.onConnect();
		if (connectResult && typeof connectResult.then === 'function') {
			await connectResult;
		}
	}
	this.phase = PHASE.CONNECTED;
	fireResolver(this.lifecycle, LIFECYCLE_PROMISE.CONNECTED);
	if (Object.keys(this.STATE).length) {
		await this.updateView();
	} else {
		await this.renderView();
	}
	Perf.measure('connect', perfMark);
}
export async function handleMove() {
	if (Logger.debugOn) {
		Logger.debug('WebComponent', `[${this.tagName}] connectedMoveCallback`);
	}
	const oldParent = this.parentComponent;
	this.unregisterFromParent?.();
	this.unregisterFromParent = null;
	attachToParent(this, resolveParentHost(this));
	await this.onMove?.(oldParent, this.parentComponent);
}
export async function handleDisconnect() {
	await this.pendingConnect;
	this.pendingConnect = null;
	unregister(this);
	if (Logger.debugOn) {
		Logger.debug('WebComponent', `[${this.tagName}] disconnectedCallback`);
	}
	this.unregisterFromParent?.();
	this.unregisterFromParent = null;
	this.parentComponent = null;
	this.uninstallObserver();
	this.disposeRemoteLists();
	this.visibleFired = false;
	this.isIntersecting = false;
	this.isIntersected = false;
	this.isVisible = false;
	this.clearTimeouts();
	this.clearIntervals();
	this.stateUnsubs?.clear();
	this.globalUnsubs?.clear();
	this.clearDelegateListeners();
	sweepHotkeyEntries(this.hotkeyEntries);
	clearUnsubs(this.gestureUnsubs);
	this.clearInjectLinks();
	this.refsMap = null;
	this.refsProxy = null;
	this.cleanupTemplate();
	this.templateBuilt = false;
	this.firstRenderDone = false;
	this.isRendering = false;
	clearRealmUnsubs(this.renderDepUnsubs);
	this.clearEventListeners();
	this.resolveStrandedConnectCyclePromises();
	await this.onDisconnect?.();
	this.phase = PHASE.DISCONNECTED;
	this.createConnectCyclePromises();
	if (this.pendingDestroy) {
		await this.handleDestroy();
	}
}
export async function handleDestroy() {
	await this.onDestroy?.();
	this.phase = PHASE.DESTROYED;
	fireResolver(this.lifecycle, LIFECYCLE_PROMISE.DESTROYED);
}
export function destroy() {
	if (this.phase === PHASE.DESTROYED) {
		return this.lifecycle.whenDestroyed;
	}
	this.pendingDestroy = true;
	if (this.isConnected) {
		this.remove();
	} else {
		this.handleDestroy().catch((error) => {
			this.onLifecycleError(error);
		});
	}
	return this.lifecycle.whenDestroyed;
}
export function resolveStrandedConnectCyclePromises() {
	for (let i = 0; i < CONNECT_CYCLE_KEYS.length; i++) {
		fireResolver(this.lifecycle, CONNECT_CYCLE_KEYS[i]);
	}
	this.lifecycle.treeVisiblePromise = null;
}
export function createConnectCyclePromises() {
	for (let i = 0; i < CONNECT_CYCLE_KEYS.length; i++) {
		assignPromisePair(this.lifecycle, CONNECT_CYCLE_KEYS[i]);
	}
	this.lifecycle.treeVisiblePromise = null;
}
export function createWhenDestroyedPromise() {
	assignPromisePair(this.lifecycle, LIFECYCLE_PROMISE.DESTROYED);
}
