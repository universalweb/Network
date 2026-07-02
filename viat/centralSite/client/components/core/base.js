/**
 * @file Universal Web Component base class — the shell only: constructor,
 * instance fields, getters, and the prototype mixin assembly. Method bodies
 * live in topic files (lifecycle, render, subscriptions, dom, phase, inert,
 * observer, styleApi, timers, factory, attrs, staticConfig) and are folded onto
 * the prototype by the `assign()` call at the bottom of this file.
 */
import { makeAttrsProxy } from './attrs/attrs.js';
import {
	collectClassChain,
	ensureMergedAttrs,
	ensureMergedConfig,
	ensureMergedProperties,
	ensureMergedState,
	ensurePropertyIndex,
	resolveStores,
} from './attrs/staticConfig.js';
import { writeTextToClipboard } from './clipboard.js';
import { componentLogger, defaultLogger } from './debug/logger.js';
import { Perf } from './debug/perf.js';
import { confirmPrompt } from './dialogs/confirm.js';
import * as animationMethods from './dom/animation.js';
import {
	clearDelegateListeners,
	delegate,
	delegateTo,
	installScopedDelegate,
	onEnv,
} from './dom/delegate.js';
import * as dom from './dom/dom.js';
import { setInert } from './dom/inert.js';
import { getRef, makeRefsProxy } from './dom/refs.js';
import { applyViewportBucket, reflectViewport } from './environment/reflectViewport.js';
import { applyThemeStyles, handleThemeChange, syncThemeStyles } from './environment/themeStyles.js';
import * as eventMethods from './events/events.js';
import { dragSnap } from './gestures/dragSnap.js';
import { dragTrack } from './gestures/dragTrack.js';
import { hotKey, hotKeyListeners } from './hotkeys/hotkeys.js';
import * as lifecycle from './lifecycle/lifecycle.js';
import { handleObserverCallback, installObserver, uninstallObserver } from './lifecycle/observer.js';
import { atPhase, PHASE, phaseGetters } from './lifecycle/phase.js';
import { nextFrame } from './lifecycle/scheduler.js';
import { createBound, getById, preRender } from './render/factory.js';
import * as renderMethods from './render/render.js';
import { bind, makeGlobalProxy, makeStoreProxy } from './state/binding.js';
import * as contextMethods from './state/context.js';
import { globalState } from './state/globalState.js';
import * as privateStateMethods from './state/privateState.js';
import { disposeRemoteLists, remote } from './state/remoteList.js';
import * as stateMethods from './state/state.js';
import * as subscriptions from './state/subscriptions.js';
import * as sharedStyles from './styles/shared-styles.js';
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
	initTemplateRuntime,
	templateCleanup,
	templateHtml,
	templateHtmlElement,
} from './template.js';
import {
	addInterval,
	clearIntervals,
	clearTimeouts,
	removeComponentTimeout,
	setComponentTimeout,
	stopInterval,
} from './timers.js';
import {
	assign,
	deepMerge,
	hasOwn,
	isFunction,
	isObject,
	isPlainObject,
	keysOf,
	smartClone,
} from './utilities.js';
export { liveChildren, registerChild } from './dom/children.js';
export { registry } from './dom/registry.js';
export { globalState, Store } from './state/globalState.js';
export { ClassList, classList } from './template.js';
/**
 * Fold the chain-merged `static state` template into a component's per-instance `STATE`.
 * Each container value is smartClone'd so every instance owns its own outer
 * objects/arrays/Maps/Sets; primitives, functions, and class instances are assigned by
 * reference. Accessor descriptors (`get`/`set` declared in `static state`) are skipped —
 * they live on the class propertyIndex and the state proxies dispatch them via
 * `.call(component)`, never installed on the instance STATE. `ownedProvidedKeys`, when
 * non-null, names the provided-state keys that a wholesale overwrite will replace, so
 * cloning their default would only be discarded — skip them (the "clone only what's
 * missing" optimization). With `mergeObjects` the clone is the deep-merge base, so the
 * caller passes null and every default is cloned.
 * @param {WebComponent} component - The instance whose STATE to seed.
 * @param {object|null} ownedProvidedKeys - Provided state when its keys should skip cloning, else null.
 */
function foldStaticStateTemplate(component, ownedProvidedKeys) {
	const mergedState = component.constructor.ensureMergedState();
	const mergedDescriptors = Object.getOwnPropertyDescriptors(mergedState);
	const mergedKeys = Object.getOwnPropertyNames(mergedDescriptors);
	const mergedKeysLength = mergedKeys.length;
	for (let mergedIndex = 0; mergedIndex < mergedKeysLength; mergedIndex += 1) {
		const mergedKey = mergedKeys[mergedIndex];
		const descriptor = mergedDescriptors[mergedKey];
		if (descriptor.get || descriptor.set) {
			continue;
		}
		if (ownedProvidedKeys && hasOwn(ownedProvidedKeys, mergedKey)) {
			continue;
		}
		const mergedValue = descriptor.value;
		if (isObject(mergedValue)) {
			component.STATE[mergedKey] = smartClone(mergedValue);
		} else {
			component.STATE[mergedKey] = mergedValue;
		}
	}
}
/**
 * Materialize a component's per-instance `STATE`: the chain-merged `static state` template
 * smart-cloned in (unless `skipStaticState`), then the caller-provided `state` folded on
 * top — adopted caller-owned via `assign` (provided containers shared by reference, never
 * cloned), or deep-merged onto the cloned defaults when `mergeObjects` is set. The provided
 * `state` is already function-resolved by the constructor. A subclass class-field
 * `state = {…}` is NOT supported — it shadows the prototype accessor and breaks reactivity;
 * use `static state` for class-level defaults.
 * @param {WebComponent} component - The instance whose STATE to build.
 * @param {*} providedState - The function-resolved constructor-arg state.
 */
function materializeInstanceState(component, providedState) {
	const providedIsObject = isPlainObject(providedState);
	const mergeObjects = component.config.mergeObjects;
	if (!component.config.skipStaticState) {
		foldStaticStateTemplate(component, providedIsObject && !mergeObjects ? providedState : null);
	}
	if (!providedIsObject) {
		return;
	}
	if (mergeObjects) {
		const argStateKeys = keysOf(providedState);
		const argStateKeysLength = argStateKeys.length;
		for (let argIndex = 0; argIndex < argStateKeysLength; argIndex += 1) {
			const argKey = argStateKeys[argIndex];
			component.STATE[argKey] = deepMerge(component.STATE[argKey], providedState[argKey]);
		}
		return;
	}
	assign(component.STATE, providedState);
}
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
	 * Resolve the framework config and the property index, attach the shadow root
	 * (unless `static useShadow === false`), compile styles, then build the
	 * per-instance `STATE`: chain-merged `static state` smart-cloned in, then the
	 * constructor-arg `state` folded on top (assigned, or deep-merged when
	 * `config.mergeObjects` is set). Finishes by wiring the reactive proxy + bus
	 * and rescuing any pre-upgrade `.foo=` assignments. Prefer `Klass.create()`.
	 * @param {object} [state] - Per-instance state, folded over the static defaults.
	 * @param {object} [config] - Per-instance config; carries the framework knobs (`skipStaticState` / `mergeState` / `mergeObjects` / `debugPatchOn`) and merges over the class `static config`.
	 */
	constructor(state = {}, config) {
		super();
		const perfMark = Perf.mark('construct');
		/*
		 * Resolve the `static properties` schema index once (cached per class).
		 * The state proxies read it to honor `react: false`, declared kinds,
		 * and computed accessors from `static state`.
		 */
		this.propertyIndex = ensurePropertyIndex(this.constructor);
		/*
		 * Wire `this.<storeName>` accessors for any `static stores` (once per
		 * class). Cheap no-op for the common case of no declared stores.
		 */
		wireStoreAccessors(this.constructor);
		/*
		 * Resolve the framework config first — subsequent pipeline steps branch
		 * on `this.config`. The instance-field knob defaults seed it, the class
		 * `static config` folds over them, then the ctor-arg `config` wins last.
		 * `skipStaticState` / `mergeObjects` are read from `this.config` here; the
		 * merge-chain knobs (`mergeState` / `mergeObjects`) are ALSO read from the
		 * class's merged config by `ensureMergedState`, which caches on the class.
		 */
		assign(this.config, this.constructor.ensureMergedConfig());
		if (config) {
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
		/*
		 * Per-instance STATE — the chain-merged `static state` template (smart-cloned for
		 * isolation) with the provided `state` folded on top. A FUNCTION `state` arg is the
		 * per-construction escape hatch: invoked here, its return used as the state (the
		 * static template + smartClone already give fresh CONTAINERS, so a function is only
		 * needed for freshly COMPUTED values). See materializeInstanceState.
		 */
		const providedState = isFunction(state) ? state() : state;
		materializeInstanceState(this, providedState);
		this.onInit?.(providedState, config);
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
		if (defaultLogger.debugOn) {
			defaultLogger.debug('Constructor', `${this.constructor.name}<${this.localName}>`);
		}
		Perf.measure('construct', perfMark);
	}
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
	/**
	 * Non-reactive construction-time config, chain-merged via `ensureMergedConfig`
	 * and folded onto each instance's `config`. Also the home of the framework
	 * behavior knobs — a subclass overrides one with `static config = { … }`:
	 * `mergeState` / `mergeObjects` govern how `ensureMergedState` folds the class
	 * chain; `skipStaticState` opts an instance out of the static-state pipeline;
	 * `debugPatchOn` gates patch-pass debug logging. Base defaults for the merge
	 * knobs live on the instance `config` field below — the chain-merge fast-path
	 * skips base `static config` for direct subclasses, so the instance field is
	 * their robust home; the reads all treat an absent knob as its default.
	 */
	static config = {};
	/**
	 * `static properties` — per-path state schema: `{ 'a.b': { kind, react } }`.
	 * `kind` declares the CONTENT_KIND (skips classification); `react: false`
	 * makes the path non-reactive (writes notify nothing). Chain-merged.
	 * Accessor descriptors (`get foo()` / `set foo()`) written in `static
	 * state` are collected into the same propertyIndex and dispatched by the
	 * state proxies via `.call(component)` — no per-instance `.bind` cost.
	 * 	TODO: Instead of per path scheme being something like 'a.b' we need to mirror the static state object structure {a: b:{}} and have a schema that mirrors the static state structure so we can have a more natural way to define the schema for the state. When proxies are working they must also traverse the properties object/path to keep track of the current path and match the properties object to it.
	 */
	static properties = {};
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
		return new this(await state, config);
	}
	/**
	 * Per-instance framework config: the merge-knob defaults seed it, then the
	 * class `static config` and the ctor-arg `config` fold over it (in that order
	 * of precedence). These three are the base knob home (the chain-merge
	 * fast-path skips base `static config`). `debugPatchOn` is intentionally
	 * absent — its render read defaults it on when unset; a component opts out
	 * via `static config`.
	 */
	config = {
		mergeState: true,
		mergeObjects: false,
		skipStaticState: false,
	};
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
	 * Accessor for the shared global store, exposed as `this.global`. Mirrors
	 * `state`'s render/write split: a dep-recording proxy during render tracking
	 * (memoized module-side by `makeGlobalProxy` — the global proxy is
	 * component-independent, so all components share one instance), the raw store
	 * proxy otherwise. The module-level `globalState` Store keeps its name; only
	 * this component accessor is `global`.
	 * @returns {object} The global state proxy.
	 */
	get global() {
		if (this.renderTracking) {
			return makeGlobalProxy(globalState.proxy);
		}
		return globalState.proxy;
	}
	/**
	 * Default lifecycle-error sink — logs with the element's tag name.
	 * Override to route errors elsewhere (telemetry, a UI fallback).
	 * @param {unknown} error - The thrown lifecycle error.
	 */
	onLifecycleError(error) {
		componentLogger.error('LIFECYCLE', `${this.constructor.name}<${this.localName}>`, this, this.state, error);
	}
	/**
	 * Default render-error sink — logs with the element's tag name. Override
	 * to render a fallback or report the failure.
	 * @param {unknown} error - The thrown render error.
	 */
	onRenderError(error) {
		componentLogger.error('RENDER', `${this.constructor.name}<${this.localName}>`, this, this.state, error);
	}
	debug(...args) {
		if (componentLogger.debugOn) {
			componentLogger.debug(`${this.constructor.name}<${this.localName}>`, this, this.state, ...args);
		}
	}
	logInfo(...args) {
		componentLogger.info(`[${this.localName}]`, this, this.state, ...args);
	}
	warnInfo(...args) {
		componentLogger.warn(`[${this.localName}]`, this, this.state, ...args);
	}
	traceInfo(...args) {
		componentLogger.trace(`[${this.localName}]`, this, this.state, ...args);
	}
	/**
	 * Await the next animation frame.
	 * @returns {Promise<number>} Resolves with the frame timestamp.
	 */
	nextFrame() {
		return nextFrame();
	}
}
/*
 * Named-store accessors are wired once per class (memoized in STORE_ACCESSORS_WIRED)
 * the first time an instance is constructed. `this.state` and `this.global` are
 * the defaults; a `static stores = { name: aStore }` entry adds `this.name` as a
 * distinct PROPERTY resolving to that store's tracking proxy — a separate accessor
 * means a separate realm, so store paths can never collide with local/global keys.
 * Defined after the class so the built-in-name guard can reference
 * `WebComponent.prototype`; the constructor calls the hoisted declaration.
 */
const STORE_ACCESSORS_WIRED = new WeakSet();
function defineStoreAccessor(ComponentClass, storeName, store) {
	Object.defineProperty(ComponentClass.prototype, storeName, {
		configurable: true,
		get() {
			if (this.renderTracking) {
				return makeStoreProxy(store);
			}
			return store.proxy;
		},
	});
}
function wireStoreAccessors(ComponentClass) {
	if (STORE_ACCESSORS_WIRED.has(ComponentClass)) {
		return;
	}
	const stores = resolveStores(ComponentClass);
	const storeNames = keysOf(stores);
	const storeNamesLength = storeNames.length;
	for (let nameIndex = 0; nameIndex < storeNamesLength; nameIndex++) {
		const storeName = storeNames[nameIndex];
		/*
		 * Reject any name that resolves to a built-in on WebComponent.prototype
		 * (state / global / render / html / on / emit / …). An INHERITED store
		 * accessor from a superclass lives on that subclass's prototype, NOT on
		 * WebComponent.prototype, so the merge case re-defines it here cleanly.
		 * Mark wired only AFTER success so a misconfigured class keeps throwing.
		 */
		if (storeName in WebComponent.prototype) {
			throw new Error(`static stores: "${storeName}" collides with a built-in accessor — rename the store.`);
		}
		defineStoreAccessor(ComponentClass, storeName, stores[storeName]);
	}
	STORE_ACCESSORS_WIRED.add(ComponentClass);
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
	atPhase,
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
	dragTrack,
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
 * `.importStyles=${sheet}` (or `element.importStyles = sheet`) — a write-only accessor
 * so a parent can push styles through a child's shadow boundary declaratively.
 */
Object.defineProperty(WebComponent.prototype, 'importStyles', {
	set: importStyles,
	configurable: true,
});
