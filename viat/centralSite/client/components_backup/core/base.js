/*
	DESCRIPTION: UNIVERSAL WEB COMPONENT --> Enhancement of native web component with batteries-included features like reactive state, templating, stylesheets, and a component registry. Designed for maximum flexibility and performance with minimal boilerplate.
*/
import * as eventMethods from './events.js';
import * as globalMethods from './globalState.js';
import * as sharedStyles from './shared-styles.js';
import * as stateMethods from './state.js';
import {
	Binding,
	makeGlobalProxy,
	makeProxy,
	setCurrentTracking,
} from './binding.js';
import { allChildren, liveChildren, registerChild } from './children.js';
import { assertComponentConfig, assertStaticStyles } from './assertions.js';
import {
	callFn,
	eachArray,
	eachObject,
	hasValue,
	isFunction,
	isPromiseLike,
	isShadowRoot,
	isString,
} from './utilities.js';
import { delegate as delegateChannel, removeDelegate as removeDelegateChannel } from './delegate.js';
import { register, registry, unregister } from './registry.js';
import { Logger } from './logger.js';
import { initState } from './state.js';
import { loadSheet } from './css-loader.js';
import { schedule } from './scheduler.js';
import {
	initTemplateRuntime,
	templateCleanup,
	templateHtml,
	templateHtmlElement,
} from './template.js';
export { liveChildren, registerChild } from './children.js';
export { classList, ClassList } from './template.js';
export {
	getGlobal,
	setGlobal,
	subscribeGlobal,
	watchGlobal,
} from './globalState.js';
export { registry } from './registry.js';
function writeHostAttr(host, key, value) {
	if (value == null || value === false) {
		host.removeAttribute(key);
		return;
	}
	if (value === true) {
		host.setAttribute(key, '');
		return;
	}
	host.setAttribute(key, String(value));
}
function readHostAttr(host, key, defaultValue) {
	if (typeof defaultValue === 'boolean') {
		return host.hasAttribute(key);
	}
	const rawValue = host.getAttribute(key);
	if (rawValue == null) {
		return defaultValue;
	}
	if (typeof defaultValue === 'number') {
		return Number(rawValue);
	}
	return rawValue;
}
function makeAttrsProxy(host, schema) {
	return new Proxy({}, {
		get(target, key) {
			if (typeof key === 'symbol' || !(key in schema)) {
				return undefined;
			}
			return readHostAttr(host, key, schema[key]);
		},
		set(target, key, value) {
			if (typeof key === 'symbol' || !(key in schema)) {
				return true;
			}
			writeHostAttr(host, key, value);
			return true;
		},
		has(target, key) {
			return key in schema;
		},
		ownKeys() {
			return Object.keys(schema);
		},
		getOwnPropertyDescriptor(target, key) {
			if (key in schema) {
				return {
					configurable: true,
					enumerable: true,
				};
			}
			return undefined;
		},
	});
}
export class WebComponent extends HTMLElement {
	static url = import.meta.url;
	static styles = {
		reset: sharedStyles.resetSheet,
		panel: sharedStyles.panelSheet,
		scrollbar: sharedStyles.scrollbarSheet,
		utils: sharedStyles.utilsSheet,
	};
	static state = {};
	static attrs = {};
	static config = {};
	constructor(state = {}, config) {
		super();
		Object.assign(this.config, this.constructor.ensureMergedConfig());
		if (config) {
			this.constructor.assertConfig(config);
			Object.assign(this.config, config);
		}
		this.attachShadow({
			mode: 'open',
		});
		this.constructor.ensureCompiledStyles();
		initTemplateRuntime(this);
		this.attrs = makeAttrsProxy(this, this.constructor.ensureMergedAttrs());
		Object.assign(this.STATE, structuredClone(this.constructor.ensureMergedState()));
		Object.assign(this.STATE, state);
		this.initState();
		this.createRenderCompletePromise();
		this.createMountedPromise();
		Logger.debug('WebComponent', `[${this.tagName}] Constructor`);
	}
	config = {};
	static isWebComponent(source) {
		return source instanceof WebComponent;
	}
	isWebComponent = true;
	static getById(key) {
		return registry[key] ?? null;
	}
	static async waitRenderTree(element) {
		if (!(element instanceof WebComponent)) {
			return;
		}
		if (element.renderComplete) {
			await element.renderComplete;
		}
		await Promise.all(allChildren(element).map(WebComponent.waitRenderTree));
	}
	static async preRender(element, mount, options = {}) {
		const duration = options.duration ?? 240;
		const easing = options.easing ?? 'cubic-bezier(0.4,0,0.2,1)';
		element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity';
		if (isFunction(mount)) {
			mount(element);
		} else if (mount instanceof HTMLElement) {
			mount.appendChild(element);
			console.log('App has been appended to the DOM');
		}
		await WebComponent.waitRenderTree(element);
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
		const animation = element.animate(
			[
				{
					opacity: 0,
				},
				{
					opacity: 1,
				},
			],
			{
				duration,
				easing,
			}
		);
		await animation.finished;
		animation.commitStyles();
		animation.cancel();
		element.style.opacity = '';
		element.style.pointerEvents = '';
		element.style.willChange = '';
		return element;
	}
	static assertConfig(config = {}) {
		assertComponentConfig(config);
	}
	static sheetCache = new Map();
	static styleSheet(source, metaUrl) {
		if (Array.isArray(source)) {
			return Promise.all(source.map((sourceItem) => {
				return this.styleSheet(sourceItem, metaUrl);
			}));
		}
		const key = metaUrl ? new URL(source, metaUrl).toString() : source;
		if (WebComponent.sheetCache.has(key)) {
			return WebComponent.sheetCache.get(key);
		}
		if (metaUrl) {
			const sheetPromise = loadSheet(key);
			WebComponent.sheetCache.set(key, sheetPromise);
			return sheetPromise;
		}
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(source);
		WebComponent.sheetCache.set(key, sheet);
		return sheet;
	}
	static collectClassChain(ComponentClass) {
		const chain = [];
		let current = ComponentClass;
		while (current && current !== HTMLElement) {
			chain.push(current);
			current = Object.getPrototypeOf(current);
		}
		chain.reverse();
		return chain;
	}
	static computeMergedState(ComponentClass) {
		const chain = WebComponent.collectClassChain(ComponentClass);
		const merged = {};
		for (let index = 0; index < chain.length; index++) {
			const classRef = chain[index];
			if (Object.hasOwn(classRef, 'state')) {
				Object.assign(merged, classRef.state);
			}
		}
		return merged;
	}
	static ensureMergedState(ComponentClass = this) {
		if (Object.hasOwn(ComponentClass, 'mergedState')) {
			return ComponentClass.mergedState;
		}
		const merged = WebComponent.computeMergedState(ComponentClass);
		Object.defineProperty(ComponentClass, 'mergedState', {
			value: merged,
			configurable: true,
			writable: true,
		});
		return merged;
	}
	static computeMergedAttrs(ComponentClass) {
		const chain = WebComponent.collectClassChain(ComponentClass);
		const merged = {};
		for (let index = 0; index < chain.length; index++) {
			const classRef = chain[index];
			if (Object.hasOwn(classRef, 'attrs')) {
				Object.assign(merged, classRef.attrs);
			}
		}
		return merged;
	}
	static ensureMergedAttrs(ComponentClass = this) {
		if (Object.hasOwn(ComponentClass, 'mergedAttrs')) {
			return ComponentClass.mergedAttrs;
		}
		const merged = WebComponent.computeMergedAttrs(ComponentClass);
		Object.defineProperty(ComponentClass, 'mergedAttrs', {
			value: merged,
			configurable: true,
			writable: true,
		});
		return merged;
	}
	static computeMergedConfig(ComponentClass) {
		const chain = WebComponent.collectClassChain(ComponentClass);
		const merged = {};
		for (let index = 0; index < chain.length; index++) {
			const classRef = chain[index];
			if (Object.hasOwn(classRef, 'config')) {
				Object.assign(merged, classRef.config);
			}
		}
		return merged;
	}
	static ensureMergedConfig(ComponentClass = this) {
		if (Object.hasOwn(ComponentClass, 'mergedConfig')) {
			return ComponentClass.mergedConfig;
		}
		const merged = WebComponent.computeMergedConfig(ComponentClass);
		Object.defineProperty(ComponentClass, 'mergedConfig', {
			value: merged,
			configurable: true,
			writable: true,
		});
		return merged;
	}
	static get observedAttributes() {
		return Object.keys(WebComponent.ensureMergedAttrs(this));
	}
	static async compileStyles(ComponentClass) {
		const chain = WebComponent.collectClassChain(ComponentClass);
		const merged = new Map();
		eachArray(chain, (classRef) => {
			if (!Object.hasOwn(classRef, 'styles')) {
				return;
			}
			assertStaticStyles(classRef.styles, classRef.name);
			eachObject(classRef.styles, (key, value) => {
				merged.set(key, {
					owner: classRef,
					value,
				});
			});
		});
		const ordered = [];
		const tasks = [];
		merged.forEach((entry, key) => {
			const {
				owner,
				value,
			} = entry;
			if (value === null || value === undefined) {
				return;
			}
			if (value instanceof CSSStyleSheet) {
				ordered.push({
					key,
					sheet: value,
				});
				return;
			}
			if (!Object.hasOwn(owner, 'url')) {
				throw new TypeError(`${owner.name}.styles.${key}: relative path "${value}" requires \`static url = import.meta.url\` on ${owner.name}.`);
			}
			const slot = {
				key,
				sheet: null,
			};
			ordered.push(slot);
			tasks.push(WebComponent.styleSheet(value, owner.url).then((sheet) => {
				slot.sheet = sheet;
			}));
		});
		await Promise.all(tasks);
		const map = new Map();
		eachArray(ordered, (slot) => {
			map.set(slot.key, slot.sheet);
		});
		return {
			map,
			array: Object.freeze([...map.values()]),
		};
	}
	static ensureCompiledStyles(ComponentClass = this) {
		if (Object.hasOwn(ComponentClass, 'compiledStylesPromise')) {
			return ComponentClass.compiledStylesPromise;
		}
		const promise = WebComponent.compileStyles(ComponentClass).then((result) => {
			ComponentClass.compiledStyles = result.map;
			ComponentClass.compiledStylesArray = result.array;
			return result;
		});
		Object.defineProperty(ComponentClass, 'compiledStylesPromise', {
			value: promise,
			configurable: true,
			writable: true,
		});
		return promise;
	}
	static preload(ComponentClass = this) {
		return WebComponent.ensureCompiledStyles(ComponentClass);
	}
	static async create(state, config = {}) {
		this.assertConfig(config);
		return new this(await state, config);
	}
	// Single-bag factory: `{ Source, state, config }` → instance.
	// Exists so component creation can be passed as a first-class callback —
	// e.g., `specs.map(WebComponent.createBound)` — without losing `this`
	// binding and without wrapping every callsite in an arrow that just
	// destructures and forwards. Useful when the component class is selected
	// per-item from a config-driven list rather than known at the callsite.
	static async createBound(spec = {}) {
		const { Source } = spec;
		return Source.create(spec.state, spec.config);
	}
	STATE = {};
	stateProxy = null;
	proxyCache = null;
	pendingFlush = false;
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
	renderResolver = null;
	renderComplete = null;
	intervals = new Set();
	pendingMount = null;
	mounted = null;
	mountedResolver = null;
	visibleObserver = null;
	visibleFired = false;
	attrObservers = null;
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
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	connectPromise = null;
	connectedCallback() {
		if (!this.firstRenderDone) {
			this.classList.add('mounting');
		}
		this.connectPromise = this.handleConnectedCallback().catch((error) => {
			Logger.error('WebComponent', `[${this.tagName}] Connected error:`, error);
			this.onLifecycleError(error);
		});
	}
	attributeChangedCallback(attrName, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		const subscribers = this.attrObservers?.get(attrName);
		if (!subscribers || subscribers.size === 0) {
			return;
		}
		const value = this.attrs[attrName];
		subscribers.forEach((subscriber) => {
			subscriber(value);
		});
	}
	async handleConnectedCallback() {
		register(this);
		Logger.debug('WebComponent', `[${this.tagName}] connectedCallback`);
		const root = this.getRootNode();
		const parentHost = isShadowRoot(root) ? root.host : this.parentElement;
		if (parentHost instanceof WebComponent) {
			this.unregisterFromParent = registerChild(parentHost, this);
		}
		await this.applyStyles();
		await this.onConnect();
		if (Object.keys(this.STATE).length) {
			await this.updateView();
		} else {
			await this.renderView();
		}
	}
	disconnectedCallback() {
		this.handleDisconnectedCallback().catch((error) => {
			Logger.error('WebComponent', `[${this.tagName}] Disconnected error:`, error);
			this.onLifecycleError(error);
		});
	}
	async handleDisconnectedCallback() {
		await this.connectPromise;
		this.connectPromise = null;
		unregister(this);
		Logger.debug('WebComponent', `[${this.tagName}] disconnectedCallback`);
		this.unregisterFromParent?.();
		this.unregisterFromParent = null;
		this.visibleObserver?.disconnect();
		this.visibleObserver = null;
		this.visibleFired = false;
		this.clearTimeouts();
		this.clearIntervals();
		this.stateUnsubs.forEach(callFn);
		this.stateUnsubs.clear();
		this.attrObservers = null;
		this.globalUnsubs.forEach(callFn);
		this.globalUnsubs.clear();
		this.delegateUnsubs.forEach(callFn);
		this.delegateUnsubs.clear();
		this.cleanupTemplate();
		this.templateBuilt = false;
		this.firstRenderDone = false;
		this.mounted = null;
		this.mountedResolver = null;
		this.createMountedPromise();
		eachArray(this.renderDepUnsubs, callFn);
		this.renderDepUnsubs = [];
		this.clearEventListeners();
		const disconnectResult = this.onDisconnect();
		if (isPromiseLike(disconnectResult)) {
			await disconnectResult;
		}
	}
	createRenderCompletePromise() {
		if (this.renderResolver) {
			return;
		}
		this.renderComplete = new Promise((resolve) => {
			this.renderResolver = resolve;
		});
	}
	createMountedPromise() {
		if (this.mountedResolver || this.mounted) {
			return;
		}
		this.mounted = new Promise((resolve) => {
			this.mountedResolver = resolve;
		});
	}
	clearTimeouts() {
		this.timeouts.forEach(clearTimeout);
		this.timeouts.clear();
	}
	clearIntervals() {
		this.intervals.forEach(clearInterval);
		this.intervals.clear();
	}
	getComponent(tag) {
		return liveChildren(this, tag?.toLowerCase())[0] ?? null;
	}
	getComponents(tag) {
		return liveChildren(this, tag?.toLowerCase());
	}
	getComponentsArray(tag) {
		const components = this.getComponents(tag);
		if (!components) {
			return [];
		}
		return [...components];
	}
	findComponent(selector, predicate) {
		return this.getComponentsArray(selector).find(predicate) ?? null;
	}
	renderDepUnsubs = [];
	invalidateRender() {
		this.templateBuilt = false;
		if (this.isConnected) {
			this.updateView();
		}
	}
	subscribeRenderDeps(deps) {
		eachArray(this.renderDepUnsubs, callFn);
		this.renderDepUnsubs = [];
		if (!deps || deps.size === 0) {
			return;
		}
		const invalidate = this.invalidateRender.bind(this);
		deps.forEach((dependency) => {
			if (dependency.startsWith('global.')) {
				if (this.watchGlobal) {
					this.renderDepUnsubs.push(this.watchGlobal(dependency.slice(7), invalidate));
				}
				return;
			}
			if (this.watchState) {
				this.renderDepUnsubs.push(this.watchState(dependency, invalidate));
			}
		});
	}
	bind(key, currentValue) {
		return new Binding(String(key ?? ''), currentValue);
	}
	styleMap = null;
	async applyStyles() {
		const ComponentClass = this.constructor;
		if (this.styleMap) {
			if (this.shadowRoot) {
				this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
			}
			return;
		}
		const result = await ComponentClass.ensureCompiledStyles();
		if (!this.shadowRoot) {
			return;
		}
		if (this.styleMap) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
			return;
		}
		this.shadowRoot.adoptedStyleSheets = result.array;
	}
	forkStyleMap() {
		if (this.styleMap) {
			return this.styleMap;
		}
		const compiled = this.constructor.compiledStyles;
		this.styleMap = compiled ? new Map(compiled) : new Map();
		return this.styleMap;
	}
	async resolveStyle(sheetOrPath, baseUrl) {
		if (sheetOrPath instanceof CSSStyleSheet) {
			return sheetOrPath;
		}
		if (!isString(sheetOrPath)) {
			throw new TypeError('addStyle expects CSSStyleSheet or string path.');
		}
		const url = baseUrl ?? this.constructor.url ?? document.baseURI;
		return WebComponent.styleSheet(sheetOrPath, url);
	}
	async addStyle(key, sheetOrPath, baseUrl) {
		if (!isString(key)) {
			throw new TypeError('addStyle: key must be a string.');
		}
		await this.constructor.ensureCompiledStyles();
		const sheet = await this.resolveStyle(sheetOrPath, baseUrl);
		this.forkStyleMap();
		this.styleMap.set(key, sheet);
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		}
		return sheet;
	}
	async removeStyle(key) {
		if (!isString(key)) {
			throw new TypeError('removeStyle: key must be a string.');
		}
		await this.constructor.ensureCompiledStyles();
		this.forkStyleMap();
		const wasDeleted = this.styleMap.delete(key);
		if (wasDeleted && this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		}
		return wasDeleted;
	}
	hasStyle(key) {
		if (this.styleMap) {
			return this.styleMap.has(key);
		}
		const compiled = this.constructor.compiledStyles;
		if (compiled) {
			return compiled.has(key);
		}
		return false;
	}
	addInterval(callback, delayMs) {
		const intervalId = setInterval(callback, delayMs);
		this.intervals.add(intervalId);
		return intervalId;
	}
	inertSequence = 0;
	setInert(shouldBeInert) {
		this.inertSequence += 1;
		const token = this.inertSequence;
		if (!shouldBeInert) {
			this.toggleAttribute('inert', false);
			return Promise.resolve();
		}
		const animations = this.getAnimations({
			subtree: true,
		});
		const finite = animations.filter((animation) => {
			return animation.effect?.getTiming?.()?.iterations !== Infinity;
		});
		if (!finite.length) {
			this.toggleAttribute('inert', true);
			return Promise.resolve();
		}
		return Promise.allSettled(finite.map((animation) => {
			return animation.finished;
		})).then(() => {
			if (this.inertSequence === token && this.isConnected) {
				this.toggleAttribute('inert', true);
			}
		});
	}
	stopInterval(intervalId) {
		clearInterval(intervalId);
		this.intervals.delete(intervalId);
	}
	observe(keys, callback) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		const component = this;
		// Defer through the render scheduler so the callback fires AFTER any
		// list/spot patches in the same batch have updated the DOM.
		const deferred = function deferredObserver(nextValue, previousValue, changedPath) {
			schedule(() => {
				return callback.call(component, nextValue, previousValue, changedPath);
			});
		};
		const unsubscribers = keyList.map((key) => {
			return this.watchState(key, deferred);
		});
		unsubscribers.forEach((unsubscribe) => {
			this.stateUnsubs.add(unsubscribe);
		});
		return () => {
			unsubscribers.forEach((unsubscribe) => {
				unsubscribe();
				this.stateUnsubs.delete(unsubscribe);
			});
		};
	}
	pendingRenderComplete = false;
	onRenderComplete() {}
	scheduleRenderComplete() {
		if (this.pendingRenderComplete) {
			return;
		}
		if (this.onRenderComplete === WebComponent.prototype.onRenderComplete) {
			return;
		}
		this.pendingRenderComplete = true;
		queueMicrotask(async () => {
			this.pendingRenderComplete = false;
			if (!this.isConnected) {
				return;
			}
			await Promise.all(allChildren(this).map(WebComponent.waitRenderTree));
			if (!this.isConnected) {
				return;
			}
			try {
				await this.onRenderComplete();
			} catch (error) {
				this.onRenderError(error);
			}
		});
	}
	observeAttr(keys, callback) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		if (!this.attrObservers) {
			this.attrObservers = new Map();
		}
		const observerMap = this.attrObservers;
		keyList.forEach((key) => {
			let subscriberSet = observerMap.get(key);
			if (!subscriberSet) {
				subscriberSet = new Set();
				observerMap.set(key, subscriberSet);
			}
			subscriberSet.add(callback);
		});
		return () => {
			if (!this.attrObservers) {
				return;
			}
			keyList.forEach((key) => {
				const subscriberSet = this.attrObservers.get(key);
				if (!subscriberSet) {
					return;
				}
				subscriberSet.delete(callback);
				if (subscriberSet.size === 0) {
					this.attrObservers.delete(key);
				}
			});
		};
	}
	observeGlobal(keys, callback) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		const unsubscribers = keyList.map((key) => {
			let previousValue = globalMethods.getGlobal(key);
			return globalMethods.subscribeGlobal(key, (nextValue, globalState, changedPath) => {
				const result = callback(nextValue, previousValue, changedPath);
				previousValue = nextValue;
				return result;
			});
		});
		unsubscribers.forEach((unsubscribe) => {
			this.globalUnsubs.add(unsubscribe);
		});
		return () => {
			unsubscribers.forEach((unsubscribe) => {
				unsubscribe();
				this.globalUnsubs.delete(unsubscribe);
			});
		};
	}
	delegate(channel, handler, options) {
		const unsubscribe = delegateChannel(channel, handler, options);
		this.delegateUnsubs.add(unsubscribe);
		return () => {
			unsubscribe();
			this.delegateUnsubs.delete(unsubscribe);
		};
	}
	removeDelegate(channel, handler) {
		removeDelegateChannel(channel, handler);
	}
	onConnect() {}
	onDisconnect() {}
	onLifecycleError(error) {
		console.error(`[${this.localName}] lifecycle error:`, error);
	}
	onRender() {}
	onMounted() {}
	onRendered() {}
	onVisible() {}
	onRenderError(error) {
		console.error(`[${this.localName}] render error:`, error);
	}
	beforeRender() {}
	async render() {}
	usesMountLifecycle() {
		return this.onMounted !== WebComponent.prototype.onMounted ||
			this.onVisible !== WebComponent.prototype.onVisible;
	}
	async waitForRenderedTree() {
		await Promise.all(allChildren(this).map(WebComponent.waitRenderTree));
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
	}
	observeVisibility() {
		if (this.visibleObserver || this.visibleFired) {
			return;
		}
		if (this.onVisible === WebComponent.prototype.onVisible) {
			return;
		}
		if (typeof IntersectionObserver === 'undefined') {
			return;
		}
		this.visibleObserver = new IntersectionObserver((entries) => {
			for (let index = 0; index < entries.length; index++) {
				if (!entries[index].isIntersecting) {
					continue;
				}
				this.visibleFired = true;
				this.visibleObserver?.disconnect();
				this.visibleObserver = null;
				Promise.resolve(this.onVisible()).catch((error) => {
					this.onLifecycleError(error);
				});
				return;
			}
		});
		this.visibleObserver.observe(this);
	}
	async runMountLifecycle() {
		await this.waitForRenderedTree();
		if (!this.isConnected) {
			return;
		}
		if (this.onMounted !== WebComponent.prototype.onMounted) {
			await this.onMounted();
		}
		this.mountedResolver?.();
		this.mountedResolver = null;
		this.observeVisibility();
	}
	scheduleMount() {
		if (!this.usesMountLifecycle()) {
			this.mountedResolver?.();
			this.mountedResolver = null;
			return Promise.resolve();
		}
		if (!this.pendingMount) {
			this.pendingMount = this.runMountLifecycle().finally(() => {
				this.pendingMount = null;
			});
		}
		return this.pendingMount;
	}
	async renderView() {
		this.templateBuilt = false;
		this.createRenderCompletePromise();
		const sequence = ++this.renderSeq;
		const renderDeps = new Set();
		const wasFirstRender = !this.firstRenderDone;
		try {
			const beforeResult = this.beforeRender();
			if (isPromiseLike(beforeResult)) {
				await beforeResult;
			}
			if (sequence !== this.renderSeq) {
				return;
			}
			this.renderTracking = true;
			const currentState = this.STATE ?? {};
			if (!this.renderProxy || this.renderProxyState !== currentState) {
				this.renderProxy = makeProxy(currentState, this);
				this.renderProxyState = currentState;
			}
			setCurrentTracking(renderDeps);
			try {
				await this.render();
			} finally {
				setCurrentTracking(null);
			}
			if (sequence !== this.renderSeq) {
				return;
			}
		} catch (error) {
			this.onRenderError(error);
		} finally {
			if (sequence === this.renderSeq) {
				this.renderTracking = false;
				const boundKeys = this.tplBoundKeys;
				if (boundKeys && boundKeys.size) {
					boundKeys.forEach((boundKey) => {
						renderDeps.delete(boundKey);
					});
				}
				this.subscribeRenderDeps(renderDeps);
			}
		}
		if (sequence === this.renderSeq) {
			try {
				this.templateBuilt = true;
				await this.onRender();
				Logger.debug(this.constructor.name, `[${this.tagName}] onRender called`);
				if (wasFirstRender) {
					this.firstRenderDone = true;
					requestAnimationFrame(() => {
						if (this.renderSeq !== sequence || !this.isConnected) {
							return;
						}
						this.classList.remove('mounting');
					});
					await this.scheduleMount();
				} else if (this.onRendered !== WebComponent.prototype.onRendered) {
					await this.onRendered();
				}
				this.scheduleRenderComplete();
			} catch (error) {
				this.onRenderError(error);
			} finally {
				this.renderResolver?.();
				this.renderResolver = null;
			}
		}
	}
	setTimeout(callback, delayMs) {
		const timeoutId = setTimeout(() => {
			this.timeouts.delete(timeoutId);
			callback();
		}, delayMs);
		this.timeouts.add(timeoutId);
		return timeoutId;
	}
	removeTimeout(timeoutId) {
		clearTimeout(timeoutId);
		this.timeouts.delete(timeoutId);
	}
	getComponentRoot() {
		return this.shadowRoot;
	}
	findElement(target) {
		return isString(target) ? document.querySelector(target) : target;
	}
	appendTo(target) {
		return this.findElement(target)?.appendChild(this);
	}
	prependTo(target) {
		return this.findElement(target)?.prepend(this);
	}
	ifAssign(target) {
		eachObject(target, (key, value) => {
			if (hasValue(this.state[key])) {
				this.state[key] = value;
			}
		});
		return target;
	}
}
Object.assign(WebComponent.prototype, stateMethods, eventMethods, globalMethods, {
	html: templateHtml,
	htmlElement: templateHtmlElement,
	cleanupTemplate: templateCleanup,
});
