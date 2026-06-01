/*
	DESCRIPTION: UNIVERSAL WEB COMPONENT --> Enhancement of native web component with batteries-included features like reactive state, templating, stylesheets, and a component registry. Designed for maximum flexibility and performance with minimal boilerplate.
	FILE LAYOUT --> Class shell only (constructor, fields, getters, mixin assembly).
	  Method bodies live in topic files: lifecycle, render, subscriptions, dom, phase, inert, observer, styleApi, timers, factory, attrs, staticConfig.
*/
import * as dom from './dom/dom.js';
import * as eventMethods from './events/events.js';
import * as lifecycle from './lifecycle/lifecycle.js';
import * as renderMethods from './render/render.js';
import * as sharedStyles from './styles/shared-styles.js';
import * as stateMethods from './state/state.js';
import * as subscriptions from './state/subscriptions.js';
import { PHASE, atPhase, phaseGetters } from './lifecycle/phase.js';
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
	importStyles,
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
import { bind, makeGlobalProxy } from './state/binding.js';
import {
	clearDelegateListeners,
	delegate,
	delegateTo,
	installScopedDelegate,
	onEnv,
} from './dom/delegate.js';
import {
	collectClassChain,
	ensureMergedAttrs,
	ensureMergedConfig,
	ensureMergedProperties,
	ensureMergedState,
	ensurePropertyIndex,
} from './attrs/staticConfig.js';
import { createBound, getById, preRender } from './render/factory.js';
import { getRef, makeRefsProxy } from './dom/refs.js';
import { handleObserverCallback, installObserver, uninstallObserver } from './lifecycle/observer.js';
import { hotKey, hotKeyListeners } from './hotkeys/hotkeys.js';
import {
	initTemplateRuntime,
	templateCleanup,
	templateHtml,
	templateHtmlElement,
} from './template.js';
import { Logger } from './debug/logger.js';
import { Perf } from './debug/perf.js';
import { assertComponentConfig } from './debug/assertions.js';
import { confirmPrompt } from './dialogs/confirm.js';
import { dragSnap } from './gestures/dragSnap.js';
import { globalState } from './state/globalState.js';
import { makeAttrsProxy } from './attrs/attrs.js';
import { nextFrame } from './lifecycle/scheduler.js';
import { setInert } from './dom/inert.js';
import { writeTextToClipboard } from './clipboard.js';
export { liveChildren, registerChild } from './dom/children.js';
export { classList, ClassList } from './template.js';
export { Store, globalState } from './state/globalState.js';
export { registry } from './dom/registry.js';
export class WebComponent extends HTMLElement {
	static url = import.meta.url;
	static styles = {
		base: sharedStyles.baseSheet,
	};
	static state = {};
	static attrs = {};
	static config = {};
	// `static properties` — per-path state schema: `{ 'a.b': { kind, react } }`.
	// `kind` declares the CONTENT_KIND (skips classification); `react: false`
	// makes the path non-reactive (writes notify nothing). Chain-merged.
	// Accessor descriptors (`get foo()` / `set foo()`) written in `static
	// state` are collected into the same propertyIndex and dispatched by the
	// state proxies via `.call(component)` — no per-instance `.bind` cost.
	static properties = {};
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
	static ensureMergedProperties(ComponentClass = this) {
		return ensureMergedProperties(ComponentClass);
	}
	static ensurePropertyIndex(ComponentClass = this) {
		return ensurePropertyIndex(ComponentClass);
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
	// Pre-warm the runtime template recipe for this class so the first real
	// mount skips the parse/install pass. Mount → first render → discard a
	// probe instance into an off-screen container; the template literal's
	// recipe is now cached for every subsequent instance of the class.
	//
	// This is the in-script equivalent of an AOT precompile: shifts the
	// parse cost from "first mount on screen" to "boot-time idle." Call it
	// in module top-level for components that mount in tight loops (lists,
	// charts, repeated rows). Returns a Promise that resolves after the
	// probe's first render completes.
	//
	// Optional `seed` is the constructor state — useful for classes whose
	// render() branches on state (e.g. depth/leaf), so you can warm both
	// branches with two calls.
	// Owner-less Tier-3 scoped delegation. For services that need delegated
	// listeners installed at module load — before any component instance
	// exists — use `WebComponent.delegateTo('pointerover', '[data-tooltip]',
	// handler, document)`. Page-lifetime listener, no auto-cleanup. The
	// instance counterpart (`this.delegateTo`) is still the way to register
	// from inside a component (it auto-sweeps on disconnect).
	static delegateTo(eventName, selector, handler, scope, options) {
		return installScopedDelegate(eventName, selector, handler, scope, options);
	}
	static async compile(seed) {
		const probe = new this(seed);
		const stash = document.createElement('div');
		stash.style.cssText = 'position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;';
		document.body.appendChild(stash);
		stash.appendChild(probe);
		try {
			await probe.lifecycle?.whenRendered;
		} finally {
			stash.remove();
		}
	}
	static async create(state, config = {}) {
		this.assertConfig(config);
		return new this(await state, config);
	}
	constructor(state = {}, config, flags) {
		super();
		const perfMark = Perf.mark('construct');
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
		// Resolve the `static properties` schema index once (cached per class).
		// The state proxies read it to honor `react: false`, declared kinds,
		// and computed accessors from `static state`.
		this.propertyIndex = ensurePropertyIndex(this.constructor);
		assign(this.config, this.constructor.ensureMergedConfig());
		if (config) {
			this.constructor.assertConfig(config);
			assign(this.config, config);
		}
		// Shadow DOM is the default. `static useShadow = false` opts into light-DOM
		// rendering: the template renders into the host element itself (every
		// render target already falls back to `this`), and styles are scoped via
		// `@scope (tag)` injected into the document (see applyStyles). The ABSENCE
		// of `this.shadowRoot` IS the light-mode signal everywhere — no separate
		// instance flag. Trade-off: no `<slot>` / `::slotted` / `:host-context`.
		if (this.constructor.useShadow !== false) {
			this.attachShadow({
				mode: 'open',
			});
		}
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
			const mergedDescriptors = Object.getOwnPropertyDescriptors(mergedState);
			const mergedKeys = Object.getOwnPropertyNames(mergedDescriptors);
			for (let mergedIndex = 0; mergedIndex < mergedKeys.length; mergedIndex += 1) {
				const mergedKey = mergedKeys[mergedIndex];
				const descriptor = mergedDescriptors[mergedKey];
				if (descriptor.get || descriptor.set) {
					// Accessor descriptors live on the class's propertyIndex
					// (collected by ensurePropertyIndex). The state proxies
					// dispatch them via `.call(component)` — no per-instance
					// `.bind`, no install on the instance STATE. The proxy
					// short-circuits BEFORE Reflect.get / Reflect.set so the
					// absence of a STATE entry never falls through.
					continue;
				}
				const mergedValue = descriptor.value;
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
		if (Logger.debugOn) {
			Logger.debug('WebComponent', `[${this.tagName}] Constructor`);
		}
		Perf.measure('construct', perfMark);
	}
	config = {};
	flags = {};
	lifecycle = {};
	isWebComponent = true;
	propertyIndex = null;
	STATE = {};
	stateProxy = null;
	stateBus = null;
	proxyCache = null;
	// Per-instance collections are lazy-allocated at first write. Simple
	// components (text-only list items, leaf cells, etc.) never use most
	// of these, and pre-allocating one Set/Map/Tracker per slot per
	// instance adds ~5500 allocations for a 500-item list and forces a
	// hidden-class transition on the WebComponent shape. The lazy-init
	// pattern uses the `??=` idiom at every call site:
	//   `(component.eventEntries ??= new Set()).add(entry);`
	// Read sites must null-check (helpers like `clearUnsubs` /
	// `sweepHotkeyEntries` already accept null).
	globalUnsubs = null;
	eventEntries = null;
	stateUnsubs = null;
	delegateEntries = null;
	hotkeyEntries = null;
	gestureUnsubs = null;
	listenerCache = null;
	templateBuilt = false;
	renderDepDirty = false;
	firstRenderDone = false;
	renderTracking = false;
	renderProxy = null;
	renderProxyState = null;
	globalRenderProxy = null;
	globalRenderProxyState = null;
	intervals = null;
	phase = PHASE.CREATED;
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
	timeouts = null;
	pendingConnect = null;
	styleMap = null;
	inertSequence = 0;
	// renderDepUnsubs stays eager — every component with a `${this.state.x}`
	// bare read populates it on first render. Lazying it costs a branch on
	// every renderView dep-sync; the population rate makes that a loss.
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
			if (!this.globalRenderProxy || this.globalRenderProxyState !== globalState.proxy) {
				this.globalRenderProxy = makeGlobalProxy(globalState.proxy, this);
				this.globalRenderProxyState = globalState.proxy;
			}
			return this.globalRenderProxy;
		}
		return globalState.proxy;
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
	// `this.bind` — the binding callable (bind / bind.text / .html /
	// .component / .list). Shared, stateless, no import needed in templates.
	bind,
	clearIntervals,
	clearTimeouts,
	cleanupTemplate: templateCleanup,
	clearDelegateListeners,
	confirm: confirmPrompt,
	copyText: writeTextToClipboard,
	delegate,
	delegateTo,
	dragSnap,
	forkStyleMap,
	handleObserverCallback,
	hasStyle,
	hotKey,
	hotKeyListeners,
	html: templateHtml,
	htmlElement: templateHtmlElement,
	installObserver,
	uninstallObserver,
	onEnv,
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
	lifecycle,
	renderMethods,
	subscriptions,
	dom,
	PROTO_METHODS
);
Object.defineProperties(WebComponent.prototype, phaseGetters);
// `.importStyles=${sheet}` (or `el.importStyles = sheet`) — a write-only accessor
// so a parent can push styles through a child's shadow boundary declaratively.
Object.defineProperty(WebComponent.prototype, 'importStyles', {
	set: importStyles,
	configurable: true,
});
