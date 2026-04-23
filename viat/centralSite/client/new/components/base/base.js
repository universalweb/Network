import * as eventMethods from './events.js';
import * as globalMethods from './globalState.js';
import * as sharedStyles from './shared-styles.js';
import * as stateMethods from './state.js';
import { allChildren, liveChildren, registerChild } from './children.js';
import { assertComponentConfig, assertComponentStyles } from './assertions.js';
import {
	isFunction,
	isPromiseLike,
	isShadowRoot,
	isString,
} from './utilities.js';
import { makeGlobalRenderProxy, makeRenderProxy } from './binding.js';
import { register, registry, unregister } from './registry.js';
import { Logger } from './logger.js';
import { attachTooltips } from '../global/tooltip-controller.js';
import { loadSheet } from './css-loader.js';
import { makeHtmlTag } from './template.js';
export { liveChildren, registerChild } from './children.js';
export {
	getGlobal,
	getGlobalState,
	setGlobal,
	setGlobalState,
	subscribeGlobal,
	watchGlobal,
} from './globalState.js';
export { registry } from './registry.js';
export class WebComponent extends HTMLElement {
	constructor(config = {}) {
		super();
		this.constructor.assertConfig(config);
		const {
			styles = [],
			tooltips = false,
		} = config;
		assertComponentStyles(styles);
		this.useTooltips = tooltips === true;
		this.attachShadow({
			mode: 'open',
		});
		if (!this.constructor.compiledStyles) {
			this.constructor.compiledStyles = [
				...new Set([
					sharedStyles.resetSheet,
					sharedStyles.panelSheet,
					sharedStyles.scrollbarSheet,
					sharedStyles.utilsSheet,
					...styles,
				]),
			];
		}
		this.shadowRoot.adoptedStyleSheets = this.constructor.compiledStyles;
		this.html = makeHtmlTag(this);
		this.initState();
		this.createRenderCompletePromise();
		Logger.debug('WebComponent', `[${this.tagName}] Constructor`);
	}
	static attrBindings = {};
	static get observedAttributes() {
		return Object.keys(this.attrBindings ?? {});
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
	static async create(config = {}) {
		this.assertConfig(config);
		const instance = new this(config);
		if (config.state !== undefined) {
			await instance.replaceState(await config.state);
		}
		return instance;
	}
	STATE = {};
	stateProxy = null;
	pendingFlush = null;
	globalUnsubs = new Set();
	effectUnsubs = new Set();
	templateBuilt = false;
	renderTracking = false;
	renderProxy = null;
	renderProxyState = null;
	globalRenderProxy = null;
	globalRenderProxyState = null;
	renderResolver = null;
	renderComplete = null;
	intervals = new Set();
	pendingRenderComplete = null;
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
	useTooltips = false;
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	connectedCallback() {
		this.handleConnectedCallback().catch((error) => {
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
		await this.onConnect();
		if (Object.keys(this.STATE).length) {
			await this.updateView();
		} else {
			await this.refresh();
		}
	}
	disconnectedCallback() {
		this.handleDisconnectedCallback().catch((error) => {
			Logger.error('WebComponent', `[${this.tagName}] Disconnected error:`, error);
			this.onLifecycleError(error);
		});
	}
	async handleDisconnectedCallback() {
		unregister(this);
		Logger.debug('WebComponent', `[${this.tagName}] disconnectedCallback`);
		this.unregisterFromParent?.();
		this.unregisterFromParent = null;
		this.unbindTooltips?.();
		this.unbindTooltips = null;
		this.clearTimeouts();
		this.clearIntervals();
		this.effectUnsubs.forEach((u) => {
			u();
		});
		this.effectUnsubs.clear();
		this.globalUnsubs.forEach((u) => {
			u();
		});
		this.globalUnsubs.clear();
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
	clearTimeouts() {
		for (const id of this.timeouts) {
			clearTimeout(id);
		}
		this.timeouts.clear();
	}
	clearIntervals() {
		for (const id of this.intervals) {
			clearInterval(id);
		}
		this.intervals.clear();
	}
	attributeChangedCallback(attributeName, oldVal, newVal) {
		this.handleAttributeChangedCallback(attributeName, oldVal, newVal).catch((error) => {
			Logger.error('WebComponent', `[${this.tagName}] Attribute error:`, error);
			this.onLifecycleError(error);
		});
	}
	async handleAttributeChangedCallback(attributeName, oldVal, newVal) {
		if (oldVal === newVal) {
			return;
		}
		Logger.debug('WebComponent', `[${this.tagName}] attributeChanged: ${attributeName} =`, newVal);
		const binding = this.constructor.attrBindings?.[attributeName];
		if (binding) {
			this.state[binding] = newVal;
		}
		const attributeChangeResult = this.onAttributeChange(attributeName, oldVal, newVal);
		if (isPromiseLike(attributeChangeResult)) {
			await attributeChangeResult;
		}
	}
	getComponent(tag) {
		return liveChildren(this, tag?.toLowerCase())[0] ?? null;
	}
	getComponents(tag) {
		return liveChildren(this, tag?.toLowerCase());
	}
	appendBatch(container, elements) {
		const frag = document.createDocumentFragment();
		frag.append(...elements);
		container.append(frag);
	}
	addStyleSheet(sheet) {
		const root = this.shadowRoot;
		if (!root || root.adoptedStyleSheets.includes(sheet)) {
			return;
		}
		root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
	}
	addInterval(fn, ms) {
		const id = setInterval(fn, ms);
		this.intervals.add(id);
		return id;
	}
	clearInterval(id) {
		clearInterval(id);
		this.intervals.delete(id);
	}
	addEffect(keys, fn) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		const unsubs = keyList.map((key) => {
			return this.watchState(key, (newVal, oldVal) => {
				return fn(this.state, newVal, oldVal);
			});
		});
		const unsub = () => {
			unsubs.forEach((u) => {
				u();
			});
		};
		this.effectUnsubs.add(unsub);
		return unsub;
	}
	onConnect() {}
	onDisconnect() {}
	onAttributeChange(attributeName, oldVal, newVal) {}
	onLifecycleError(error) {
		console.error(`[${this.localName}] lifecycle error:`, error);
	}
	onRender() {}
	onRenderComplete() {}
	onRenderError(error) {
		console.error(`[${this.localName}] render error:`, error);
	}
	beforeRender() {}
	async render() {}
	usesRenderCompleteLifecycle() {
		return this.useTooltips || this.onRenderComplete !== WebComponent.prototype.onRenderComplete;
	}
	async waitForRenderedTree() {
		await Promise.all(allChildren(this).map(WebComponent.waitRenderTree));
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
	}
	async runRenderCompleteLifecycle() {
		await this.waitForRenderedTree();
		if (this.useTooltips) {
			this.unbindTooltips?.();
			this.unbindTooltips = null;
			const unbind = await attachTooltips(this.getComponentRoot());
			if (!this.isConnected) {
				unbind();
				return;
			}
			this.unbindTooltips = unbind;
		}
		if (this.onRenderComplete !== WebComponent.prototype.onRenderComplete) {
			await this.onRenderComplete();
		}
	}
	scheduleRenderComplete() {
		if (!this.usesRenderCompleteLifecycle()) {
			return Promise.resolve();
		}
		if (!this.pendingRenderComplete) {
			this.pendingRenderComplete = this.runRenderCompleteLifecycle().finally(() => {
				this.pendingRenderComplete = null;
			});
		}
		return this.pendingRenderComplete;
	}
	async refresh() {
		this.templateBuilt = false;
		this.createRenderCompletePromise();
		const seq = ++this.renderSeq;
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
			if (!this.globalRenderProxy || this.globalRenderProxyState !== globalMethods.GLOBAL_STATE) {
				this.globalRenderProxy = makeGlobalRenderProxy(globalMethods.GLOBAL_STATE, this);
				this.globalRenderProxyState = globalMethods.GLOBAL_STATE;
			}
			await this.render();
			if (seq !== this.renderSeq) {
				return;
			}
		} catch (error) {
			this.onRenderError(error);
		} finally {
			if (seq === this.renderSeq) {
				this.renderTracking = false;
			}
		}
		if (seq === this.renderSeq) {
			try {
				this.templateBuilt = true;
				await this.onRender();
				await this.scheduleRenderComplete();
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
	clearTimeout(id) {
		clearTimeout(id);
		this.timeouts.delete(id);
	}
	getComponentRoot() {
		return this.shadowRoot ?? this;
	}
	resolve(target) {
		return isString(target) ? document.querySelector(target) : target;
	}
	appendTo(target) {
		return this.resolve(target)?.appendChild(this);
	}
	prependTo(target) {
		return this.resolve(target)?.prepend(this);
	}
}
Object.assign(WebComponent.prototype, stateMethods, eventMethods, globalMethods);
