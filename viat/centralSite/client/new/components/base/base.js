import * as eventMethods from './events.js';
import * as globalMethods from './globalState.js';
import * as sharedStyles from './shared-styles.js';
import * as stateMethods from './state.js';
import {
	Binding,
	makeGlobalRenderProxy,
	makeRenderProxy,
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
import { register, registry, unregister } from './registry.js';
import { Logger } from './logger.js';
import { attachTooltips } from './tooltip-controller.js';
import { initState } from './state.js';
import { loadSheet } from './css-loader.js';
import { makeHtmlTag } from './template.js';
export { liveChildren, registerChild } from './children.js';
export {
	getGlobal,
	setGlobal,
	subscribeGlobal,
	watchGlobal,
} from './globalState.js';
export { registry } from './registry.js';
export class WebComponent extends HTMLElement {
	static url = import.meta.url;
	static styles = {
		reset: sharedStyles.resetSheet,
		panel: sharedStyles.panelSheet,
		scrollbar: sharedStyles.scrollbarSheet,
		utils: sharedStyles.utilsSheet,
	};
	static state = {};
	constructor(state = {}, config = {}) {
		super();
		this.constructor.assertConfig(config);
		const { tooltips = false } = config;
		this.useTooltips = tooltips === true;
		this.attachShadow({
			mode: 'open',
		});
		this.constructor.ensureCompiledStyles();
		this.html = makeHtmlTag(this);
		Object.assign(this.STATE, structuredClone(this.constructor.ensureMergedState()));
		Object.assign(this.STATE, state);
		this.initState();
		this.createRenderCompletePromise();
		this.createMountedPromise();
		Logger.debug('WebComponent', `[${this.tagName}] Constructor`);
	}
	static findComponent(key) {
		return registry[key] ?? null;
	}
	static async waitRenderTree(el) {
		if (!WebComponent.isWebComponent(el)) {
			return;
		}
		if (el.renderComplete) {
			await el.renderComplete;
		}
		await Promise.all(allChildren(el).map(WebComponent.waitRenderTree));
	}
	static async preRender(element, mount, opts = {}) {
		const duration = opts.duration ?? 240;
		const easing = opts.easing ?? 'cubic-bezier(0.4,0,0.2,1)';
		element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity';
		if (isFunction(mount)) {
			mount(element);
		} else if (mount instanceof HTMLElement) {
			mount.appendChild(element);
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
	static isWebComponent(source) {
		return source instanceof WebComponent;
	}
	static assertConfig(config = {}) {
		assertComponentConfig(config);
	}
	static sheetCache = new Map();
	static styleSheet(source, metaUrl) {
		if (Array.isArray(source)) {
			return Promise.all(source.map((s) => {
				return this.styleSheet(s, metaUrl);
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
	static collectStyleChain(C) {
		const chain = [];
		let cur = C;
		while (cur && cur !== HTMLElement) {
			chain.push(cur);
			cur = Object.getPrototypeOf(cur);
		}
		chain.reverse();
		return chain;
	}
	static computeMergedState(C) {
		const chain = WebComponent.collectStyleChain(C);
		const merged = {};
		for (let i = 0; i < chain.length; i++) {
			const cls = chain[i];
			if (Object.hasOwn(cls, 'state')) {
				Object.assign(merged, cls.state);
			}
		}
		return merged;
	}
	static ensureMergedState(C = this) {
		if (Object.hasOwn(C, 'mergedState')) {
			return C.mergedState;
		}
		const merged = WebComponent.computeMergedState(C);
		Object.defineProperty(C, 'mergedState', {
			value: merged,
			configurable: true,
			writable: true,
		});
		return merged;
	}
	static async compileStyles(C) {
		const chain = WebComponent.collectStyleChain(C);
		const merged = new Map();
		eachArray(chain, (cls) => {
			if (!Object.hasOwn(cls, 'styles')) {
				return;
			}
			assertStaticStyles(cls.styles, cls.name);
			eachObject(cls.styles, (key, value) => {
				merged.set(key, {
					owner: cls,
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
	static ensureCompiledStyles(C = this) {
		if (Object.hasOwn(C, 'compiledStylesPromise')) {
			return C.compiledStylesPromise;
		}
		const promise = WebComponent.compileStyles(C).then((result) => {
			C.compiledStyles = result.map;
			C.compiledStylesArray = result.array;
			return result;
		});
		Object.defineProperty(C, 'compiledStylesPromise', {
			value: promise,
			configurable: true,
			writable: true,
		});
		return promise;
	}
	static preload(C = this) {
		return WebComponent.ensureCompiledStyles(C);
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
	pendingFlush = null;
	globalUnsubs = new Set();
	customEventListeners = new Set();
	observed = new Set();
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
				this.globalRenderProxy = makeGlobalRenderProxy(globalMethods.GLOBAL_STATE, this);
				this.globalRenderProxyState = globalMethods.GLOBAL_STATE;
			}
			return this.globalRenderProxy;
		}
		return globalMethods.GLOBAL_STATE;
	}
	unbindTooltips = null;
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	connectPromise = null;
	connectedCallback() {
		this.connectPromise = this.handleConnectedCallback().catch((error) => {
			Logger.error('WebComponent', `[${this.tagName}] Connected error:`, error);
			this.onLifecycleError(error);
		});
	}
	async handleConnectedCallback() {
		register(this);
		Logger.debug('WebComponent', `[${this.tagName}] connectedCallback`);
		const root = this.getRootNode();
		const parentHost = isShadowRoot(root) ? root.host : this.parentElement;
		if (WebComponent.isWebComponent(parentHost)) {
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
		this.unbindTooltips?.();
		this.unbindTooltips = null;
		this.visibleObserver?.disconnect();
		this.visibleObserver = null;
		this.visibleFired = false;
		this.clearTimeouts();
		this.clearIntervals();
		this.observed.forEach(callFn);
		this.observed.clear();
		this.globalUnsubs.forEach(callFn);
		this.globalUnsubs.clear();
		this.html?.cleanup?.();
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
	subscribeRenderDeps(deps) {
		eachArray(this.renderDepUnsubs, callFn);
		this.renderDepUnsubs = [];
		if (!deps || deps.size === 0) {
			return;
		}
		const invalidate = () => {
			this.templateBuilt = false;
		};
		deps.forEach((dep) => {
			if (dep.startsWith('global.')) {
				if (this.watchGlobal) {
					this.renderDepUnsubs.push(this.watchGlobal(dep.slice(7), invalidate));
				}
				return;
			}
			if (this.watchState) {
				this.renderDepUnsubs.push(this.watchState(dep, invalidate));
			}
		});
	}
	bind(key, currentValue) {
		return new Binding(String(key ?? ''), currentValue);
	}
	styleMap = null;
	async applyStyles() {
		const C = this.constructor;
		if (this.styleMap) {
			if (this.shadowRoot) {
				this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
			}
			return;
		}
		const result = await C.ensureCompiledStyles();
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
		const had = this.styleMap.delete(key);
		if (had && this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		}
		return had;
	}
	replaceStyle(key, sheetOrPath, baseUrl) {
		return this.addStyle(key, sheetOrPath, baseUrl);
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
	addInterval(fn, ms) {
		const id = setInterval(fn, ms);
		this.intervals.add(id);
		return id;
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
		if (!animations.length) {
			this.toggleAttribute('inert', true);
			return Promise.resolve();
		}
		return Promise.allSettled(animations.map((animation) => {
			return animation.finished;
		})).then(() => {
			if (this.inertSequence === token && this.isConnected) {
				this.toggleAttribute('inert', true);
			}
		});
	}
	stopInterval(id) {
		clearInterval(id);
		this.intervals.delete(id);
	}
	observe(keys, fn) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		const unsubs = keyList.map((key) => {
			return this.watchState(key, fn);
		});
		const unsub = () => {
			unsubs.forEach(callFn);
			this.observed.delete(unsub);
		};
		this.observed.add(unsub);
		return unsub;
	}
	observeGlobal(keys, fn) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		const unsubs = keyList.map((key) => {
			let previousValue = globalMethods.getGlobal(key);
			return globalMethods.subscribeGlobal(key, (nextValue, globalState, changedPath) => {
				const result = fn(nextValue, previousValue, changedPath);
				previousValue = nextValue;
				return result;
			});
		});
		const unsub = () => {
			unsubs.forEach(callFn);
			this.observed.delete(unsub);
		};
		this.observed.add(unsub);
		return unsub;
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
		return this.useTooltips ||
			this.onMounted !== WebComponent.prototype.onMounted ||
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
			for (let i = 0; i < entries.length; i++) {
				if (!entries[i].isIntersecting) {
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
		if (this.useTooltips && !this.unbindTooltips) {
			const unbind = await attachTooltips(this.getComponentRoot());
			if (!this.isConnected) {
				unbind();
				return;
			}
			this.unbindTooltips = unbind;
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
		const seq = ++this.renderSeq;
		const renderDeps = new Set();
		const wasFirstRender = !this.firstRenderDone;
		try {
			const beforeResult = this.beforeRender();
			if (isPromiseLike(beforeResult)) {
				await beforeResult;
			}
			if (seq !== this.renderSeq) {
				return;
			}
			this.renderTracking = true;
			const currentState = this.STATE ?? {};
			if (!this.renderProxy || this.renderProxyState !== currentState) {
				this.renderProxy = makeRenderProxy(currentState, this);
				this.renderProxyState = currentState;
			}
			setCurrentTracking(renderDeps);
			try {
				await this.render();
			} finally {
				setCurrentTracking(null);
			}
			if (seq !== this.renderSeq) {
				return;
			}
		} catch (error) {
			this.onRenderError(error);
		} finally {
			if (seq === this.renderSeq) {
				this.renderTracking = false;
				const boundKeys = this.html?.boundKeys?.();
				if (boundKeys && boundKeys.size) {
					boundKeys.forEach((boundKey) => {
						renderDeps.delete(boundKey);
					});
				}
				this.subscribeRenderDeps(renderDeps);
			}
		}
		if (seq === this.renderSeq) {
			try {
				this.templateBuilt = true;
				await this.onRender();
				if (wasFirstRender) {
					this.firstRenderDone = true;
					await this.scheduleMount();
				} else if (this.onRendered !== WebComponent.prototype.onRendered) {
					await this.onRendered();
				}
			} catch (error) {
				this.onRenderError(error);
			} finally {
				this.renderResolver?.();
				this.renderResolver = null;
			}
		}
	}
	setTimeout(fn, ms) {
		const id = setTimeout(() => {
			this.timeouts.delete(id);
			fn();
		}, ms);
		this.timeouts.add(id);
		return id;
	}
	removeTimeout(id) {
		clearTimeout(id);
		this.timeouts.delete(id);
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
Object.assign(WebComponent.prototype, stateMethods, eventMethods, globalMethods);
