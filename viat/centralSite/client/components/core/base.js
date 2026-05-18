/*
	DESCRIPTION: UNIVERSAL WEB COMPONENT --> Enhancement of native web component with batteries-included features like reactive state, templating, stylesheets, and a component registry. Designed for maximum flexibility and performance with minimal boilerplate.
	FILE LAYOUT --> Class shell only (constructor, fields, getters, mixin assembly).
	  Method bodies live in topic files: lifecycle, render, subscriptions, dom, phase, inert, observer, styleApi, timers, factory, attrs, staticConfig.
*/
import * as dom from './dom/dom.js';
import * as eventMethods from './events/events.js';
import * as globalMethods from './state/globalState.js';
import * as lifecycle from './lifecycle/lifecycle.js';
import * as renderMethods from './render/render.js';
import * as sharedStyles from './styles/shared-styles.js';
import * as stateMethods from './state/state.js';
import * as subscriptions from './state/subscriptions.js';
import {
	addInterval,
	clearIntervals,
	clearTimeouts,
	removeComponentTimeout,
	setComponentTimeout,
	stopInterval,
} from './timers.js';
import {
	addStyle,
	applyStyles,
	compileStyles,
	ensureCompiledStyles,
	forkStyleMap,
	hasStyle,
	removeStyle,
	resolveStyle,
	styleSheet,
} from './styles/styleApi.js';
import {
	assign,
	deepMerge,
	isPlainObject,
	keysOf,
	smartClone,
} from './utilities.js';
import { atPhase, phaseGetters } from './lifecycle/phase.js';
import {
	collectClassChain,
	ensureMergedAttrs,
	ensureMergedConfig,
	ensureMergedState,
} from './attrs/staticConfig.js';
import { createBound, getById, preRender } from './render/factory.js';
import { getRef, makeRefsProxy } from './dom/refs.js';
import { handleObserverCallback, installObserver, uninstallObserver } from './lifecycle/observer.js';
import {
	initTemplateRuntime,
	templateCleanup,
	templateHtml,
	templateHtmlElement,
} from './template.js';
import { Logger } from './debug/logger.js';
import { assertComponentConfig } from './debug/assertions.js';
import { makeAttrsProxy } from './attrs/attrs.js';
import { makeGlobalProxy } from './state/binding.js';
import { nextFrame } from './lifecycle/scheduler.js';
import { setInert } from './dom/inert.js';
export { liveChildren, registerChild } from './dom/children.js';
export { classList, ClassList } from './template.js';
export {
	getGlobal,
	setGlobal,
	subscribeGlobal,
	watchGlobal,
} from './state/globalState.js';
export { registry } from './dom/registry.js';
export class WebComponent extends HTMLElement {
	static url = import.meta.url;
	static styles = {
		base: sharedStyles.baseSheet,
	};
	static state = {};
	static attrs = {};
	static config = {};
	// Framework behavior knobs. Class-shape decisions, naturally inherited
	// through the static prototype chain — a subclass declares the override.
	// `mergeState` and `mergeObjects` govern how `ensureMergedState` folds
	// the class chain; `skipStaticState` lets an instance opt out of the
	// static state pipeline entirely.
	static mergeState = true;
	static mergeObjects = false;
	static skipStaticState = false;
	static isWebComponent(source) {
		return source instanceof WebComponent;
	}
	static getById = getById;
	static preRender = preRender;
	static createBound = createBound;
	static assertConfig(config = {}) {
		assertComponentConfig(config);
	}
	static styleSheet(source, metaUrl) {
		return styleSheet(source, metaUrl);
	}
	static collectClassChain(ComponentClass) {
		return collectClassChain(ComponentClass);
	}
	static ensureMergedState(ComponentClass = this) {
		return ensureMergedState(ComponentClass);
	}
	static ensureMergedAttrs(ComponentClass = this) {
		return ensureMergedAttrs(ComponentClass);
	}
	static ensureMergedConfig(ComponentClass = this) {
		return ensureMergedConfig(ComponentClass);
	}
	static get observedAttributes() {
		return keysOf(ensureMergedAttrs(this));
	}
	static compileStyles(ComponentClass) {
		return compileStyles(ComponentClass);
	}
	static ensureCompiledStyles(ComponentClass = this) {
		return ensureCompiledStyles(ComponentClass);
	}
	static preload(ComponentClass = this) {
		return ensureCompiledStyles(ComponentClass);
	}
	static async create(state, config = {}) {
		this.assertConfig(config);
		return new this(await state, config);
	}
	constructor(state = {}, config, flags) {
		super();
		// Framework flags resolved first — subsequent pipeline steps branch on
		// `this.flags`. Class-level statics seed the defaults (with standard
		// JS static inheritance), then ctor-arg `flags` override per-instance.
		// Only `skipStaticState` is consulted from `this.flags` here; the
		// merge-chain flags (`mergeState`/`mergeObjects`) read from the class
		// because `ensureMergedState` caches its result on the class.
		this.flags.skipStaticState = this.constructor.skipStaticState === true;
		this.flags.mergeState = this.constructor.mergeState !== false;
		this.flags.mergeObjects = this.constructor.mergeObjects === true;
		if (flags) {
			assign(this.flags, flags);
		}
		assign(this.config, this.constructor.ensureMergedConfig());
		if (config) {
			this.constructor.assertConfig(config);
			assign(this.config, config);
		}
		this.attachShadow({
			mode: 'open',
		});
		this.constructor.ensureCompiledStyles();
		initTemplateRuntime(this);
		this.attrs = makeAttrsProxy(this, this.constructor.ensureMergedAttrs());
		// `static state` is a class-level template — chain-merged across the
		// inheritance line via flag-aware folding, cached on the class, then
		// smart-cloned per instance so every component owns its own outer
		// containers. Primitives pass through as direct assigns. Constructor-
		// arg `state` is treated as caller-owned: no smartClone, no deep
		// traversal (unless `mergeObjects` is on, in which case it deep-
		// merges into the static-cloned containers via `deepMerge`).
		// Subclass class-field `state = {…}` is NOT supported — the class
		// field shadows the prototype accessor and silently breaks reactivity.
		// Use `static state` for class-level defaults.
		if (!this.flags.skipStaticState) {
			const mergedState = this.constructor.ensureMergedState();
			const mergedKeys = keysOf(mergedState);
			for (let mergedIndex = 0; mergedIndex < mergedKeys.length; mergedIndex += 1) {
				const mergedKey = mergedKeys[mergedIndex];
				const mergedValue = mergedState[mergedKey];
				if (mergedValue === null || typeof mergedValue !== 'object') {
					this.STATE[mergedKey] = mergedValue;
				} else {
					this.STATE[mergedKey] = smartClone(mergedValue);
				}
			}
		}
		if (isPlainObject(state)) {
			if (this.flags.mergeObjects) {
				const argStateKeys = keysOf(state);
				for (let argIndex = 0; argIndex < argStateKeys.length; argIndex += 1) {
					const argKey = argStateKeys[argIndex];
					this.STATE[argKey] = deepMerge(this.STATE[argKey], state[argKey]);
				}
			} else {
				assign(this.STATE, state);
			}
		}
		this.onInit?.(state, config, flags);
		this.initState();
		// Lazy-property rescue: parents may have assigned `.state=${…}` (or
		// any other accessor-backed `.foo=`) on this element before its
		// class was loaded, creating an own data prop that now shadows the
		// prototype's getter/setter pair. Migrate those shadows through the
		// proper channel now that STATE + stateProxy are ready — subclass
		// setters that do `this.state.x = …` need the proxy to exist.
		this.upgradeShadowedProperties();
		this.createConnectCyclePromises();
		this.createWhenDestroyedPromise();
		Logger.debug('WebComponent', () => {
			return `[${this.tagName}] Constructor`;
		});
	}
	config = {};
	flags = {};
	lifecycle = {};
	isWebComponent = true;
	STATE = {};
	stateProxy = null;
	stateBus = null;
	proxyCache = null;
	globalUnsubs = new Set();
	customEventListeners = new Set();
	stateUnsubs = new Set();
	delegateUnsubs = new Set();
	templateBuilt = false;
	firstRenderDone = false;
	renderTracking = false;
	renderProxy = null;
	renderProxyState = null;
	globalRenderProxy = null;
	globalRenderProxyState = null;
	intervals = new Set();
	attrObservers = null;
	phase = 'created';
	isRendering = false;
	isIntersecting = false;
	isIntersected = false;
	isVisible = false;
	parentComponent = null;
	pendingDestroy = false;
	intersectObserved = false;
	visibleFired = false;
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	pendingConnect = null;
	styleMap = null;
	inertSequence = 0;
	renderDepUnsubs = new Map();
	refsMap = null;
	refsProxy = null;
	get refs() {
		this.refsProxy ??= makeRefsProxy(this);
		return this.refsProxy;
	}
	getRef(refName) {
		return getRef(this, refName);
	}
	get state() {
		if (this.renderTracking) {
			return this.renderProxy;
		}
		return this.stateProxy;
	}
	set state(value) {
		this.replaceState(value);
	}
	get globalState() {
		if (this.renderTracking) {
			if (!this.globalRenderProxy || this.globalRenderProxyState !== globalMethods.GLOBAL_STATE) {
				this.globalRenderProxy = makeGlobalProxy(globalMethods.GLOBAL_STATE, this);
				this.globalRenderProxyState = globalMethods.GLOBAL_STATE;
			}
			return this.globalRenderProxy;
		}
		return globalMethods.GLOBAL_STATE;
	}
	atPhase = atPhase;
	onLifecycleError(error) {
		console.error(`[${this.localName}] lifecycle error:`, error);
	}
	onRenderError(error) {
		console.error(`[${this.localName}] render error:`, error);
	}
	nextFrame() {
		return nextFrame();
	}
}
const PROTO_METHODS = {
	addInterval,
	addStyle,
	applyStyles,
	clearIntervals,
	clearTimeouts,
	cleanupTemplate: templateCleanup,
	forkStyleMap,
	handleObserverCallback,
	hasStyle,
	html: templateHtml,
	htmlElement: templateHtmlElement,
	installObserver,
	uninstallObserver,
	removeStyle,
	removeTimeout: removeComponentTimeout,
	resolveStyle,
	setTimeout: setComponentTimeout,
	setInert,
	stopInterval,
};
assign(
	WebComponent.prototype,
	stateMethods,
	eventMethods,
	globalMethods,
	lifecycle,
	renderMethods,
	subscriptions,
	dom,
	PROTO_METHODS
);
Object.defineProperties(WebComponent.prototype, phaseGetters);
