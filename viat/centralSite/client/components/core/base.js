/**
 * @file Universal Web Component base class — the shell only: constructor,
 * instance fields, getters, and the prototype mixin assembly. Method bodies
 * live in topic files (lifecycle, render, subscriptions, dom, phase, inert,
 * observer, styleApi, timers, factory, attrs, staticConfig) and are folded onto
 * the prototype by the `assign()` call at the bottom of this file.
 */
import * as animationMethods from './dom/animation.js';
import * as contextMethods from './state/context.js';
import * as dom from './dom/dom.js';
import * as eventMethods from './events/events.js';
import * as lifecycle from './lifecycle/lifecycle.js';
import * as privateStateMethods from './state/privateState.js';
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
import { applyThemeStyles, handleThemeChange, syncThemeStyles } from './environment/themeStyles.js';
import { applyViewportBucket, reflectViewport } from './environment/reflectViewport.js';
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
import { disposeRemoteLists, remote } from './state/remoteList.js';
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
/**
 * Base class for every custom element in the framework. Extends the native
 * `HTMLElement` with reactive `static state`, tagged-template rendering,
 * scoped stylesheets, lifecycle hooks, and a per-instance subscription system.
 *
 * Construct via the static factory (`Klass.create(state, config)`) rather than
 * `new`, so async setup and config assertion run before the element is used.
 * Subclasses declare class-level defaults on the statics below (`state`,
 * `attrs`, `config`, `properties`) and implement `render()` plus any lifecycle
 * hooks (`onInit`, `onConnect`, `onMount`, `onRender`, `onDisconnect`, …).
 *
 * @example
 * class Counter extends WebComponent {
 *   static state = { count: 0 };
 *   increment() { this.state.count += 1; }
 *   render() { this.html`<button @click=${this.increment}>${this.state.count}</button>`; }
 * }
 * customElements.define('ui-counter', Counter);
 */
export class WebComponent extends HTMLElement {
	static url = import.meta.url;
	static styles = {
		...sharedStyles.uwcBase,
	};
	/**
	 * Light-DOM style isolation knob, consulted only when `useShadow === false`.
	 * `true` (default): styles are scoped to the tag via `@scope (tag)` injected
	 * into the document. `false`: NO isolation — `static styles` become normal
	 * global CSS in `<head>` (`./path.css` → deduped `<link>`, inline sheets →
	 * `<style>`), the "plain HTML component" mode. No effect under shadow DOM.
	 */
	static scopeStyles = true;
	static state = {};
	static attrs = {};
	static config = {};
	/**
	 * `static properties` — per-path state schema: `{ 'a.b': { kind, react } }`.
	 * `kind` declares the CONTENT_KIND (skips classification); `react: false`
	 * makes the path non-reactive (writes notify nothing). Chain-merged.
	 * Accessor descriptors (`get foo()` / `set foo()`) written in `static
	 * state` are collected into the same propertyIndex and dispatched by the
	 * state proxies via `.call(component)` — no per-instance `.bind` cost.
	 */
	static properties = {};
	/**
	 * Framework behavior knobs. Class-shape decisions, naturally inherited
	 * through the static prototype chain — a subclass declares the override.
	 * `mergeState` and `mergeObjects` govern how `ensureMergedState` folds
	 * the class chain; `skipStaticState` lets an instance opt out of the
	 * static state pipeline entirely.
	 */
	static mergeState = true;
	static mergeObjects = false;
	static skipStaticState = false;
	/**
	 * Type guard for WebComponent instances.
	 * @param {unknown} source - Value to test.
	 * @returns {boolean} True when `source` is a WebComponent instance.
	 */
	static isWebComponent(source) {
		return source instanceof WebComponent;
	}
	static getById = getById;
	static preRender = preRender;
	static createBound = createBound;
	/**
	 * Validate a constructor config bundle, throwing on unknown or invalid keys.
	 * Runs from `create()` before construction so misconfiguration fails loud.
	 * @param {object} [config] - The config bundle to validate.
	 */
	static assertConfig(config = {}) {
		assertComponentConfig(config);
	}
	/**
	 * Build a constructable stylesheet from a CSS source.
	 * @param {string|CSSStyleSheet} source - CSS text or an existing sheet.
	 * @param {string} [metaUrl] - `import.meta.url` for resolving relative refs.
	 * @returns {CSSStyleSheet} The constructed stylesheet.
	 */
	static styleSheet(source, metaUrl) {
		return styleSheet(source, metaUrl);
	}
	/**
	 * Walk the static inheritance chain up to WebComponent.
	 * @param {typeof WebComponent} ComponentClass - The class to start from.
	 * @returns {Array<typeof WebComponent>} The chain in subclass-first order.
	 */
	static collectClassChain(ComponentClass) {
		return collectClassChain(ComponentClass);
	}
	/*
	 * The ensureMerged* family folds each `static X` down the class chain once
	 * and caches the result on the class, so per-instance setup is a lookup, not
	 * a re-merge. Each defaults to `this` (the concrete subclass).
	 */
	/**
	 * Resolve and cache the chain-merged `static state` template for a class.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {object} The merged state template.
	 */
	static ensureMergedState(ComponentClass = this) {
		return ensureMergedState(ComponentClass);
	}
	/**
	 * Resolve and cache the chain-merged `static attrs` map for a class.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {object} The merged attrs map.
	 */
	static ensureMergedAttrs(ComponentClass = this) {
		return ensureMergedAttrs(ComponentClass);
	}
	/**
	 * Resolve and cache the chain-merged `static config` for a class.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {object} The merged config.
	 */
	static ensureMergedConfig(ComponentClass = this) {
		return ensureMergedConfig(ComponentClass);
	}
	/**
	 * Resolve and cache the chain-merged `static properties` schema for a class.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {object} The merged properties schema.
	 */
	static ensureMergedProperties(ComponentClass = this) {
		return ensureMergedProperties(ComponentClass);
	}
	/**
	 * Resolve and cache the per-class property index the state proxies read for
	 * declared kinds, `react: false` paths, and `static state` accessors.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {object} The property index.
	 */
	static ensurePropertyIndex(ComponentClass = this) {
		return ensurePropertyIndex(ComponentClass);
	}
	/**
	 * Custom Elements reactivity contract — the attribute names to observe,
	 * derived from the merged `static attrs`.
	 * @returns {string[]} The observed attribute names.
	 */
	static get observedAttributes() {
		return keysOf(ensureMergedAttrs(this));
	}
	/**
	 * Compile this class's `static styles` into constructable stylesheets.
	 * @param {typeof WebComponent} ComponentClass - Class whose styles to compile.
	 * @returns {Promise} Resolves with the compiled `{ map, array }` result.
	 */
	static compileStyles(ComponentClass) {
		return compileStyles(ComponentClass);
	}
	/**
	 * Compile and cache the class's stylesheets if not already done (idempotent).
	 * @param {typeof WebComponent} [ComponentClass] - Class whose styles to warm.
	 * @returns {Promise} The cached compile promise.
	 */
	static ensureCompiledStyles(ComponentClass = this) {
		return ensureCompiledStyles(ComponentClass);
	}
	/**
	 * Eagerly warm a class's compiled styles before first mount. Alias of
	 * `ensureCompiledStyles`, named for intent at the call site.
	 * @param {typeof WebComponent} [ComponentClass] - Class whose styles to warm.
	 * @returns {Promise} The cached compile promise.
	 */
	static preload(ComponentClass = this) {
		return ensureCompiledStyles(ComponentClass);
	}
	/**
	 * Register a page-lifetime delegated listener that exists before any
	 * instance does, for module-load services such as a global tooltip handler.
	 * There is no auto-cleanup; it lives for the page. The instance method
	 * `this.delegateTo` is the in-component counterpart and auto-sweeps on disconnect.
	 * @param {string} eventName - Event type to delegate.
	 * @param {string} selector - Match target via event delegation.
	 * @param {Function} handler - Called when a delegated event matches.
	 * @param {EventTarget} [scope=document] - Where the listener attaches.
	 * @param {AddEventListenerOptions} [options] - Native listener options.
	 * @returns {Function} A disposer that removes the listener.
	 */
	static delegateTo(eventName, selector, handler, scope, options) {
		return installScopedDelegate(eventName, selector, handler, scope, options);
	}
	/**
	 * Pre-warm the runtime template recipe for this class so the first real
	 * mount skips the parse/install pass: mount a probe instance into an
	 * off-screen container, await its first render (which caches the template
	 * recipe for every later instance), then discard it. The in-script
	 * equivalent of an AOT precompile — shifts parse cost from "first mount on
	 * screen" to boot-time idle. Worth calling at module top-level for classes
	 * that mount in tight loops (list rows, chart cells).
	 * @param {object} [seed] - Constructor state; warm a state-branching render by calling once per branch.
	 * @returns {Promise<void>} Resolves after the probe's first render.
	 */
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
	/**
	 * Preferred construction entry point. Asserts the config, awaits `state`
	 * (so callers can pass a promise), then constructs. Use `Klass.create(...)`
	 * over `new Klass(...)` so async setup and validation run up front.
	 * @param {object|Promise<object>} [state] - Constructor state (may be a promise).
	 * @param {object} [config] - Per-instance config, asserted before construction.
	 * @returns {Promise<WebComponent>} The constructed instance.
	 */
	static async create(state, config = {}) {
		this.assertConfig(config);
		return new this(await state, config);
	}
	/**
	 * Resolve framework flags and the property index, attach the shadow root
	 * (unless `static useShadow === false`), compile styles, then build the
	 * per-instance `STATE`: chain-merged `static state` smart-cloned in, then the
	 * constructor-arg `state` folded on top (assigned, or deep-merged when
	 * `mergeObjects` is set). Finishes by wiring the reactive proxy + bus and
	 * rescuing any pre-upgrade `.foo=` assignments. Prefer `Klass.create()`.
	 * @param {object} [state] - Per-instance state, folded over the static defaults.
	 * @param {object} [config] - Per-instance config, asserted then merged.
	 * @param {object} [flags] - Per-instance framework flags (`skipStaticState` / `mergeState` / `mergeObjects`) that override the statics.
	 */
	constructor(state = {}, config, flags) {
		super();
		const perfMark = Perf.mark('construct');
		/*
		 * Framework flags resolved first — subsequent pipeline steps branch on
		 * `this.flags`. Class-level statics seed the defaults (with standard
		 * JS static inheritance), then ctor-arg `flags` override per-instance.
		 * Only `skipStaticState` is consulted from `this.flags` here; the
		 * merge-chain flags (`mergeState`/`mergeObjects`) read from the class
		 * because `ensureMergedState` caches its result on the class.
		 */
		this.flags.skipStaticState = this.constructor.skipStaticState === true;
		this.flags.mergeState = this.constructor.mergeState !== false;
		this.flags.mergeObjects = this.constructor.mergeObjects === true;
		if (flags) {
			assign(this.flags, flags);
		}
		/*
		 * Resolve the `static properties` schema index once (cached per class).
		 * The state proxies read it to honor `react: false`, declared kinds,
		 * and computed accessors from `static state`.
		 */
		this.propertyIndex = ensurePropertyIndex(this.constructor);
		assign(this.config, this.constructor.ensureMergedConfig());
		if (config) {
			this.constructor.assertConfig(config);
			assign(this.config, config);
		}
		/**
		 * Shadow DOM is the default. `static useShadow = false` opts into light-DOM
		 * rendering: the template renders into the host element itself (every
		 * render target already falls back to `this`), and styles are scoped via
		 * `@scope (tag)` injected into the document — unless `static scopeStyles
		 * === false`, which emits unscoped global CSS into `<head>` instead (the
		 * plain-HTML-component mode; see applyStyles / headStyles.js). The ABSENCE
		 * of `this.shadowRoot` IS the light-mode signal everywhere — no separate
		 * instance flag. `<slot>` / `<slot name>` content projection is emulated
		 * for light DOM (see dom/projection.js); the CSS-only `::slotted` /
		 * `:host-context` pseudos remain shadow-exclusive.
		 */
		if (this.constructor.useShadow !== false) {
			this.attachShadow({
				mode: 'open',
			});
		}
		this.constructor.ensureCompiledStyles();
		initTemplateRuntime(this);
		this.attrs = makeAttrsProxy(this, this.constructor.ensureMergedAttrs());
		/**
		 * `static state` is a class-level template — chain-merged across the
		 * inheritance line via flag-aware folding, cached on the class, then
		 * smart-cloned per instance so every component owns its own outer
		 * containers. Primitives pass through as direct assigns. Constructor-
		 * arg `state` is treated as caller-owned: no smartClone, no deep
		 * traversal (unless `mergeObjects` is on, in which case it deep-
		 * merges into the static-cloned containers via `deepMerge`).
		 * Subclass class-field `state = {…}` is NOT supported — the class
		 * field shadows the prototype accessor and silently breaks reactivity.
		 * Use `static state` for class-level defaults.
		 */
		if (!this.flags.skipStaticState) {
			const mergedState = this.constructor.ensureMergedState();
			const mergedDescriptors = Object.getOwnPropertyDescriptors(mergedState);
			const mergedKeys = Object.getOwnPropertyNames(mergedDescriptors);
			for (let mergedIndex = 0; mergedIndex < mergedKeys.length; mergedIndex += 1) {
				const mergedKey = mergedKeys[mergedIndex];
				const descriptor = mergedDescriptors[mergedKey];
				if (descriptor.get || descriptor.set) {
					/*
					 * Accessor descriptors live on the class's propertyIndex
					 * (collected by ensurePropertyIndex). The state proxies
					 * dispatch them via `.call(component)` — no per-instance
					 * `.bind`, no install on the instance STATE. The proxy
					 * short-circuits BEFORE Reflect.get / Reflect.set so the
					 * absence of a STATE entry never falls through.
					 */
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
		/*
		 * Lazy-property rescue: parents may have assigned `.state=${…}` (or
		 * any other accessor-backed `.foo=`) on this element before its
		 * class was loaded, creating an own data prop that now shadows the
		 * prototype's getter/setter pair. Migrate those shadows through the
		 * proper channel now that STATE + stateProxy are ready — subclass
		 * setters that do `this.state.x = …` need the proxy to exist.
		 */
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
	/*
	 * Per-instance collections are lazy-allocated at first write. Simple
	 * components (text-only list items, leaf cells, etc.) never use most
	 * of these, and pre-allocating one Set/Map/Tracker per slot per
	 * instance adds ~5500 allocations for a 500-item list and forces a
	 * hidden-class transition on the WebComponent shape. The lazy-init
	 * pattern uses the `??=` idiom at every call site:
	 *   `(component.eventEntries ??= new Set()).add(entry);`
	 * Read sites must null-check (helpers like `clearUnsubs` /
	 * `sweepHotkeyEntries` already accept null).
	 */
	globalUnsubs = null;
	eventEntries = null;
	stateUnsubs = null;
	delegateEntries = null;
	hotkeyEntries = null;
	gestureUnsubs = null;
	listenerCache = null;
	/*
	 * Scoped DI (state/context.js): `provided` = what THIS component exposes;
	 * `providedConsumers` = per-key Sets of descendants to kick on re-provide;
	 * `injectLinks` = WeakRef links this consumer must drop on disconnect.
	 */
	provided = null;
	providedConsumers = null;
	injectLinks = null;
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
	/*
	 * renderDepUnsubs stays eager — every component with a `${this.state.x}`
	 * bare read populates it on first render. Lazying it costs a branch on
	 * every renderView dep-sync; the population rate makes that a loss.
	 */
	renderDepUnsubs = new Map();
	refsMap = null;
	refsProxy = null;
	/**
	 * Lazily-built proxy over the template's named refs (`#name` in markup).
	 * Read an element with `this.refs.name`; entries are `WeakRef`-backed and
	 * resolve to the live node. Prefer this over `querySelector`.
	 * @returns {object} The refs proxy.
	 */
	get refs() {
		this.refsProxy ??= makeRefsProxy(this);
		return this.refsProxy;
	}
	/**
	 * Imperative single-ref lookup by name (the `this.refs.name` getter is the
	 * usual path).
	 * @param {string} refName - The `#name` declared in the template.
	 * @returns {Element|null} The referenced element, or null.
	 */
	getRef(refName) {
		return getRef(this, refName);
	}
	/**
	 * Reactive state accessor. During a render-tracking pass it returns the
	 * dep-recording render proxy (so `${this.state.x}` reads register as deps);
	 * otherwise the plain write/notify proxy. Read and mutate through it
	 * (`this.state.x = y` notifies); never assign a class field named `state`.
	 * @returns {object} The reactive state proxy.
	 */
	get state() {
		if (this.renderTracking) {
			return this.renderProxy;
		}
		return this.stateProxy;
	}
	/**
	 * Assigning `this.state = obj` wholesale routes through `replaceState`,
	 * which preserves the bus and re-notifies subscribers against the new state.
	 * @param {object} value - The replacement state object.
	 */
	set state(value) {
		this.replaceState(value);
	}
	/**
	 * Accessor for the shared global store. Mirrors `state`'s render/write split:
	 * a per-instance dep-recording proxy during render tracking (rebuilt if the
	 * global proxy identity changed), the raw store proxy otherwise.
	 * @returns {object} The global state proxy.
	 */
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
	/**
	 * Default lifecycle-error sink — logs with the element's tag name.
	 * Override to route errors elsewhere (telemetry, a UI fallback).
	 * @param {unknown} error - The thrown lifecycle error.
	 */
	onLifecycleError(error) {
		console.error(`[${this.localName}] lifecycle error:`, error);
	}
	/**
	 * Default render-error sink — logs with the element's tag name. Override
	 * to render a fallback or report the failure.
	 * @param {unknown} error - The thrown render error.
	 */
	onRenderError(error) {
		console.error(`[${this.localName}] render error:`, error);
	}
	/**
	 * Await the next animation frame.
	 * @returns {Promise<number>} Resolves with the frame timestamp.
	 */
	nextFrame() {
		return nextFrame();
	}
}
/**
 * Directly-imported instance methods folded onto the prototype below. These are
 * standalone functions (not part of a topic-file namespace) plus a few aliases
 * (`confirm`, `copyText`, `cleanupTemplate`, `removeTimeout`, `setTimeout`).
 */
const PROTO_METHODS = {
	addInterval,
	addStyle,
	applyStyles,
	applyThemeStyles,
	applyViewportBucket,
	handleThemeChange,
	syncThemeStyles,
	/*
	 * `this.bind` — the binding callable (bind / bind.text / .html /
	 * .component / .list). Shared, stateless, no import needed in templates.
	 */
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
	reflectViewport,
	remote,
	disposeRemoteLists,
	removeStyle,
	removeTimeout: removeComponentTimeout,
	resolveStyle,
	setTimeout: setComponentTimeout,
	setInert,
	stopInterval,
};
/*
 * Fold every topic file's exported methods (plus PROTO_METHODS) onto the
 * prototype. Later sources win on key collisions, so order is intentional.
 */
assign(
	WebComponent.prototype,
	stateMethods,
	privateStateMethods,
	contextMethods,
	animationMethods,
	eventMethods,
	lifecycle,
	renderMethods,
	subscriptions,
	dom,
	PROTO_METHODS
);
Object.defineProperties(WebComponent.prototype, phaseGetters);
/*
 * `.importStyles=${sheet}` (or `el.importStyles = sheet`) — a write-only accessor
 * so a parent can push styles through a child's shadow boundary declaratively.
 */
Object.defineProperty(WebComponent.prototype, 'importStyles', {
	set: importStyles,
	configurable: true,
});
