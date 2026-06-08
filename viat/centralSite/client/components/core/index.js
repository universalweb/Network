/*
	Universal Web Components — public surface.
	Re-exports the curated public API. Deep imports continue to work for advanced use.
*/
import { WebComponent } from './base.js';
import { applyAiMixin } from './ai/mixin.js';
applyAiMixin(WebComponent);
/*
 * Make WebComponent reachable without an import — `class X extends WebComponent`
 * works once the `webcomponent` package has been loaded anywhere in the app.
 */
globalThis.WebComponent ??= WebComponent;
export {
	ClassList,
	Store,
	WebComponent,
	classList,
	globalState,
	liveChildren,
	registerChild,
	registry,
} from './base.js';
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
export { bind, CONTENT_KIND } from './state/binding.js';
export { assignState } from './state/state.js';
export {
	getRoots,
	registerRoot,
	resolveTag,
	resolveTagUrl,
	scanAndResolve,
} from './resolver.js';
export { getRef, makeRefsProxy, registerRef } from './dom/refs.js';
export { setDocumentTitle, syncDocumentTitle } from './dom/documentTitle.js';
export { allChildren } from './dom/children.js';
export {
	appendTo,
	findComponent,
	getComponent,
	getComponentRoot,
	getComponents,
	getComponentsArray,
	ifAssign,
	prependTo,
} from './dom/dom.js';
export { DelegateEntry, emitDelegate } from './dom/delegate.js';
export { canonicalizeCombo, registerHotkey } from './hotkeys/hotkeys.js';
export { createDragSnap, SNAP_MS, SNAP_CURVE } from './gestures/dragSnap.js';
export { movingIndicator } from './indicator/movingIndicator.js';
export {
	registerBehavior,
	getBehavior,
	isBehaviorAttr,
	behaviorAttrNames,
} from './behaviors/index.js';
export { setInert } from './dom/inert.js';
export { UniversalWebSocket } from './net/universalWebSocket.js';
export { FRAME_TYPE } from './net/envelope.js';
export { nextFrame, schedule } from './lifecycle/scheduler.js';
export { atPhase } from './lifecycle/phase.js';
export {
	addInterval,
	clearIntervals,
	clearTimeouts,
	removeComponentTimeout,
	setComponentTimeout,
	stopInterval,
} from './timers.js';
export { Logger, IS_PRODUCTION } from './debug/logger.js';
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
