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
	ensureResolvedConfig,
	ensureStateFoldPlan,
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
import {
	findComponent, findComponentGlobal, findComponents, findComponentsGlobal,
} from './dom/search.js';
import { applyViewportBucket, reflectViewport } from './environment/reflectViewport.js';
import { applyThemeStyles, handleThemeChange, syncThemeStyles } from './environment/themeStyles.js';
import * as eventMethods from './events/events.js';
import { dragSnap } from './gestures/dragSnap.js';
import { dragTrack } from './gestures/dragTrack.js';
import { hotKey, hotKeyListeners } from './hotkeys/hotkeys.js';
import * as lifecycle from './lifecycle/lifecycle.js';
import { Lifecycle } from './lifecycle/lifecyclePromises.js';
import { handleObserverCallback, installObserver, uninstallObserver } from './lifecycle/observer.js';
import { atPhase, PHASE, phaseGetters } from './lifecycle/phase.js';
import { nextFrame } from './lifecycle/scheduler.js';
import { createBound, getById, preRender } from './render/factory.js';
import * as renderMethods from './render/render.js';
import {
	bind, makeGlobalProxy, makeStoreProxy, notifyAttrChange,
} from './state/binding.js';
import { collectionCtrl, disposeCollections, ensureCollection } from './state/collectionEngine.js';
import * as contextMethods from './state/context.js';
import { globalState } from './state/globalState.js';
import { disposeLists, listCtrl } from './state/listHandle.js';
import * as privateStateMethods from './state/privateState.js';
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
	comp,
	each,
	filter,
	ifThen,
	initTemplateRuntime,
	list as listBinding,
	templateCleanup,
	templateHtml,
	templateHtmlElement,
} from './template.js';
import {
	addInterval,
	clearIntervals,
	clearTimeouts,
	createComponentTimeout,
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
	isPromiseLike,
	keysOf,
	smartClone,
} from './utilities.js';
/*
 * The promise-state tail of `WebComponent.create` — split out so the dominant
 * plain-object create never enters an async frame.
 */
async function createWithAwaitedState(ComponentClass, statePromise, config) {
	return new ComponentClass(await statePromise, config);
}
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
	/*
	 * The per-class fold plan (staticConfig.ensureStateFoldPlan) pre-filters the
	 * accessors and precomputes the data key/value + clone-flag arrays once, so
	 * this per-instance path is a flat indexed loop — no descriptor bag, no
	 * accessor scan per construct (this runs 500× on a list mount).
	 */
	const plan = component.constructor.ensureStateFoldPlan();
	const keys = plan.keys;
	const values = plan.values;
	const cloneFlags = plan.clone;
	const STATE = component.STATE;
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index += 1) {
		const key = keys[index];
		if (ownedProvidedKeys && hasOwn(ownedProvidedKeys, key)) {
			continue;
		}
		const value = values[index];
		STATE[key] = cloneFlags[index] ? smartClone(value) : value;
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
 * Proxy handler behind `this.stores` — the namespaced reactive-store access
 * (`this.stores.shop.count`). The proxy TARGET is the class's chain-merged
 * `static stores` table, so enumeration (`Object.keys` / `in`) reflects the
 * declared names for free; this handler only intercepts reads to hand back the
 * right per-store proxy for the component's current mode. The namespace is
 * read-only — stores are declared statically (`static stores`), never assigned
 * through the namespace.
 */
class StoresNamespaceHandler {
	constructor(component) {
		this.component = component;
	}
	get(storesTable, storeName) {
		const store = storesTable[storeName];
		if (!store) {
			return undefined;
		}
		if (this.component.renderTracking) {
			return makeStoreProxy(store);
		}
		return store.proxy;
	}
	set(storesTable, storeName) {
		throw new Error(`this.stores.${String(storeName)} is read-only — declare stores via static stores.`);
	}
	deleteProperty(storesTable, storeName) {
		throw new Error(`this.stores.${String(storeName)} cannot be deleted — the store table is static.`);
	}
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
		 * Resolve the framework config first — subsequent pipeline steps branch
		 * on `this.config`. The dominant no-ctor-config construction SHARES the
		 * class's frozen resolvedConfig (knob defaults + chain-merged `static
		 * config`) — zero per-instance allocation; a ctor-arg config forks a
		 * per-instance copy with the arg winning last. `skipStaticState` /
		 * `mergeObjects` are read from `this.config` here; the merge-chain knobs
		 * are ALSO read from the class's merged config by `ensureMergedState`,
		 * which caches on the class.
		 */
		const resolvedConfig = ensureResolvedConfig(this.constructor);
		this.config = config ? assign(assign({}, resolvedConfig), config) : resolvedConfig;
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
		/*
		 * Lifecycle promise slots start PENDING by construction (Lifecycle class
		 * field defaults) — no arm call and no promise minting here; slots arm
		 * lazily on first read and re-arm on reconnect.
		 */
		this.upgradeShadowedProperties();
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
	/**
	 * Document-wide search: the first CONNECTED component matching the search,
	 * anywhere, scanning the flat connected roster in connect order. The
	 * no-starting-point form — a console probe or an agent tool locating a
	 * component it cannot navigate to. Use the instance `findComponent` when
	 * you have a host and want its subtree.
	 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
	 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
	 * @returns {WebComponent|null} The first match, or null.
	 */
	static findComponent(tag, predicate) {
		return findComponentGlobal(tag, predicate);
	}
	/**
	 * Document-wide search: every CONNECTED component matching the search, in
	 * connect order.
	 * @param {string|Function} [tag] - Tag to narrow by, or a predicate to test every component.
	 * @param {Function} [predicate] - Match test, when `tag` narrows by tag.
	 * @returns {WebComponent[]} A fresh array of every match (empty when none).
	 */
	static findComponents(tag, predicate) {
		return findComponentsGlobal(tag, predicate);
	}
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
	 * Resolve and cache the per-class state fold plan (data key/value + clone-flag
	 * arrays) consumed by per-instance state materialization.
	 * @param {typeof WebComponent} [ComponentClass] - Class to resolve.
	 * @returns {{keys: string[], values: unknown[], clone: boolean[]}} The fold plan.
	 */
	static ensureStateFoldPlan(ComponentClass = this) {
		return ensureStateFoldPlan(ComponentClass);
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
	 * Custom Elements reactivity contract — the other half of `observedAttributes`.
	 * Makes the `this.attrs.*` channel reactive: a change to an observed attribute
	 * (external `setAttribute` or an imperative `this.attrs.x = …` write, which
	 * routes through `setAttribute`) notifies the component's bus on the attr's
	 * namespaced path, so any spot that READ `this.attrs.<name>` during render
	 * re-patches. A change no spot read hits no subscriber and skips the repaint.
	 * `oldValue === newValue` guards the redundant fire `setAttribute`-to-same-value
	 * still enqueues; the `isConnected` gate drops parse-time callbacks (initial
	 * values are read live at first render).
	 * @param {string} attributeName - The changed attribute name.
	 * @param {string|null} oldValue - Previous value.
	 * @param {string|null} newValue - Current value.
	 */
	attributeChangedCallback(attributeName, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) {
			return;
		}
		notifyAttrChange(this, attributeName);
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
		// whenRendered never rejects — the render pipeline contains hook failures.
		await probe.lifecycle?.whenRendered;
		stash.remove();
	}
	/**
	 * Preferred construction entry point. Accepts `state` as a value OR a
	 * promise; only the promise case pays an await (a plain object constructs
	 * synchronously and returns pre-resolved — an unconditional `await state`
	 * cost a microtask on every create). Use `Klass.create(...)` over
	 * `new Klass(...)` so async setup and validation run up front.
	 * @param {object|Promise<object>} [state] - Constructor state (may be a promise).
	 * @param {object} [config] - Per-instance config, forked over the class config.
	 * @returns {Promise<WebComponent>} The constructed instance.
	 */
	static create(state, config) {
		if (isPromiseLike(state)) {
			return createWithAwaitedState(this, state, config);
		}
		return Promise.resolve(new this(state, config));
	}
	/**
	 * Per-instance framework config, assigned in the constructor: the class's
	 * frozen `resolvedConfig` (knob defaults + chain-merged `static config`)
	 * shared as-is, or a per-instance fork when a ctor-arg config overrides it.
	 * Declared here (null) so the field sits in the class-field shape; the knob
	 * defaults live in staticConfig's CONFIG_KNOB_DEFAULTS. `debugPatchOn` is
	 * intentionally absent — its render read defaults it on when unset; a
	 * component opts out via `static config`.
	 */
	config = null;
	lifecycle = new Lifecycle();
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
	/*
	 * Learned on the first render from what render() actually RETURNED — a fact,
	 * not a signature sniff (`render.constructor !== AsyncFunction` misses a sync
	 * render that returns a promise). Gates the synchronous patch-pass fast path;
	 * false until the first render proves otherwise, so the very first pass always
	 * takes the full async lifecycle.
	 */
	renderIsSync = false;
	storesNamespace = null;
	intervals = null;
	phase = PHASE.CREATED;
	isIntersecting = false;
	isIntersected = false;
	isVisible = false;
	parentComponent = null;
	pendingDestroy = false;
	intersectObserved = false;
	visibleFired = false;
	renderSeq = 0;
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
	 * Namespaced access to the class's declared reactive stores:
	 * `this.stores.<name>.path`. ONE reserved property (`stores`) instead of one
	 * per store name, so a store can never collide with a component method or
	 * field — everything store-shaped lives exactly where you expect it. The
	 * namespace is a lazy per-instance Proxy whose target is the class's merged
	 * `static stores` table (so `Object.keys(this.stores)` / `in` enumerate the
	 * declared names); each store read resolves through the same split as
	 * `state` / `global` — the store's dep-tracking proxy during render
	 * tracking, the raw store proxy otherwise.
	 * @returns {Proxy} The stores namespace.
	 */
	get stores() {
		this.storesNamespace ??= new Proxy(resolveStores(this.constructor), new StoresNamespaceHandler(this));
		return this.storesNamespace;
	}
	/*
	 * Framework failures surface as EVENTS, not method hooks: 'renderError'
	 * (async-lane render/hook failures) and 'lifecycleError' (runHook-routed
	 * lifecycle hooks) — cancelable, bubbling, composed; detail.data is the
	 * error. preventDefault() marks it handled; unprevented errors rethrow raw
	 * through queueAsyncError (see utilities.js emitError). Sync-lane render
	 * throws never emit — they propagate raw to window's ErrorEvent (the
	 * platform's own error-as-event channel).
	 */
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
 * Dual-mode `this.collection` (headless CollectionEngine — rows paint via
 * `${this.list(key, Row)}` / `${this.filter(...)}` after ensure):
 *   this.collection(key)                          → handle
 *   this.collection(key, this.state.itemsConfig)  → ensure Engine (preferred reactive bag)
 *   this.collection(key, { loader, … })           → ensure (snapshot / { from })
 *   this.collection(key, () => ({ … }))           → ensure (tracked factory)
 */
function collection(key, configOrFactory) {
	if (arguments.length < 2) {
		return collectionCtrl.call(this, key);
	}
	return ensureCollection.call(this, key, configOrFactory);
}
/*
 * `this.list(key)` → ListHandle (find/search/row access after mount);
 * `this.list(key, renderFn, keyFn?)` → binding factory for templates.
 * Free-function export stays the factory only (`import { list }`).
 */
function list(key, renderFn, keyFn) {
	if (arguments.length < 2) {
		return listCtrl.call(this, key);
	}
	return listBinding(key, renderFn, keyFn);
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
	/*
	 * Template helpers as instance methods. Dual-mode:
	 *   this.list(key, Row) → binding; this.list(key) → ListHandle
	 *   this.collection(key, { loader, … }) → ensure Engine (onConnect)
	 *   this.collection(key) → load handle
	 * Prefer these so callers only import `WebComponent`. Do NOT put
	 * `classList` here — it would shadow the native DOM `Element.classList`.
	 */
	comp,
	each,
	filter,
	ifThen,
	list,
	collection,
	clearIntervals,
	clearTimeouts,
	cleanupTemplate: templateCleanup,
	clearDelegateListeners,
	confirm: confirmPrompt,
	copyText: writeTextToClipboard,
	createTimeout: createComponentTimeout,
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
	disposeCollections,
	disposeLists,
	removeStyle,
	removeTimeout: removeComponentTimeout,
	resolveStyle,
	setTimeout: setComponentTimeout,
	setInert,
	stopInterval,
	/*
	 * Deep subtree search (dom/search.js) — breadth-first over the child
	 * registry, so the shallowest match wins. Named without "child" precisely
	 * because they are NOT one level: getChild/findChild are direct children,
	 * findComponent/findComponents are any depth.
	 */
	findComponent,
	findComponents,
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
 * Write-only is the contract: it is a push channel into adoptedStyleSheets, and a
 * getter would imply a readable "current value" that does not exist.
 */
// eslint-disable-next-line accessor-pairs
Object.defineProperty(WebComponent.prototype, 'importStyles', {
	set: importStyles,
	configurable: true,
});
