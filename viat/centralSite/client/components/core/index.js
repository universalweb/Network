/*
	Universal Web Components — public surface.
	Re-exports the curated public API. Deep imports continue to work for advanced use.
*/
/*
 * Device detection is part of the core surface — the import's one-shot module
 * body runs while this graph evaluates, so `environment.device` is populated
 * in globalState before any component boots. Consts are re-exported below.
 */
import './environment/device.js';
import { enableAiFor } from './ai/mixin.js';
import { WebComponent } from './base.js';
/*
 * AI is LAZY. The mixin is deliberately NOT applied at load, so `aiRegister` /
 * `aiUnregister` stay absent and the framework's optional-chained lifecycle calls
 * (`this.aiRegister?.()` / `this.aiUnregister?.()`) are true no-ops — every
 * component connects and disconnects with ZERO AI-registry cost. `enableAi()`
 * arms the subsystem on demand (the agent pulldown opening, a transport
 * attaching, or an app that wants it eagerly): it applies the mixin once and
 * backfills the live tree so an agent connecting mid-session sees the whole page.
 * Idempotent, and stays armed once on. This replaces the former unconditional
 * `applyAiMixin(WebComponent)` here, which taxed every component for a subsystem
 * that nothing was consuming.
 */
export function enableAi() {
	enableAiFor(WebComponent);
}
/*
 * Make WebComponent reachable without an import — `class X extends WebComponent`
 * works once the `webcomponent` package has been loaded anywhere in the app.
 */
globalThis.WebComponent ??= WebComponent;
export {
	ClassList,
	classList,
	globalState,
	liveChildren,
	registerChild,
	registry,
	Store,
	WebComponent,
} from './base.js';
export {
	behaviorAttrNames,
	getBehavior,
	isBehaviorAttr,
	registerBehavior,
} from './behaviors/index.js';
export {
	componentLogger,
	defaultLogger,
	IS_PRODUCTION,
} from './debug/logger.js';
export { computeAnchor } from './dom/anchor.js';
export { flipMorph } from './dom/animation.js';
export { allChildren } from './dom/children.js';
export { DelegateEntry, emitDelegate } from './dom/delegate.js';
export { setDocumentTitle, syncDocumentTitle } from './dom/documentTitle.js';
export {
	appendTo,
	findComponent,
	findComponents,
	getComponent,
	getComponentRoot,
	getComponents,
	getComponentsArray,
	ifAssign,
	prependTo,
} from './dom/dom.js';
export { setInert } from './dom/inert.js';
export { getRef, makeRefsProxy, registerRef } from './dom/refs.js';
export {
	browser,
	deviceType,
	engine,
	isAndroid,
	isApple,
	isDesktop,
	isIOS,
	isLinux,
	isMac,
	isMobile,
	isTablet,
	isTouch,
	isWindows,
	os,
	userAgent,
} from './environment/device.js';
export { DragSnap, SNAP_CURVE, SNAP_MS } from './gestures/dragSnap.js';
export { DragTrack } from './gestures/dragTrack.js';
export { canonicalizeCombo, registerHotkey } from './hotkeys/hotkeys.js';
export { movingIndicator } from './indicator/movingIndicator.js';
export { atPhase } from './lifecycle/phase.js';
export { nextFrame, schedule } from './lifecycle/scheduler.js';
export { FRAME_TYPE } from './net/envelope.js';
export { UniversalWebSocket } from './net/universalWebSocket.js';
export {
	getRoots,
	registerRoot,
	resolveTag,
	resolveTagUrl,
	scanAndResolve,
} from './resolver.js';
export { bind, CONTENT_KIND } from './state/binding.js';
export { RemoteListEngine } from './state/remoteListEngine.js';
export { assignState } from './state/state.js';
export {
	comp,
	each,
	filter,
	html,
	ifThen,
	list,
	remoteList,
	styles,
} from './template.js';
export {
	addInterval,
	clearIntervals,
	clearTimeouts,
	removeComponentTimeout,
	setComponentTimeout,
	stopInterval,
} from './timers.js';
export {
	assign,
	assignPromisePair,
	cachedProxy,
	callFn,
	clearUnsubs,
	createElementFromHTML,
	eachArray,
	eachNodeList,
	eachObject,
	fireResolver,
	getOrInit,
	getProto,
	getValueAtPath,
	hasOwn,
	hasValue,
	isArray,
	isElement,
	isEmpty,
	isError,
	isFunction,
	isNull,
	isObject,
	isPlainObject,
	isPromiseLike,
	isShadowRoot,
	isString,
	isSymbol,
	isTypeUndefined,
	isUndefined,
	joinPath,
	keysOf,
	noValue,
	parsePath,
	pathsOverlap,
	plainEqual,
	queueAsyncError,
	resolveTarget,
	runHook,
	setValueAtPath,
	smartClone,
	syncSubsByDiff,
} from './utilities.js';
