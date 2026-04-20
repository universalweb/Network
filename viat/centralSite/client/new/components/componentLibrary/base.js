import * as eventMethods from './events.js';
import * as globalMethods from './globalState.js';
import * as stateMethods from './state.js';
import { allChildren, liveChildren, registerChild } from './children.js';
import { isFunction, isShadowRoot } from '../utilities.js';
import { register, registry, unregister } from './registry.js';
import { attachTooltips } from '../global/tooltip-controller.js';
import { makeHtmlTag } from './template.js';
import { makeRenderProxy } from './binding.js';
export { liveChildren, registerChild } from './children.js';
export { getGlobalState, setGlobalState, subscribeGlobal } from './globalState.js';
export { registry } from './registry.js';
export class WebComponent extends HTMLElement {
	static WC = Symbol.for('wc.base');
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
		await el.renderComplete;
		await Promise.all(allChildren(el).map(WebComponent.waitRenderTree));
	}
	static async preRender(element, mount, opts = {}) {
		const duration = opts.duration ?? 240;
		const easing = opts.easing ?? 'cubic-bezier(0.4,0,0.2,1)';
		element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity';
		console.log(`[preRender] mounting ${element.localName} hidden`);
		if (typeof mount === 'function') {
			mount(element);
		} else {
			mount.appendChild(element);
		}
		await WebComponent.waitRenderTree(element);
		await new Promise((r) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(r);
			});
		});
		console.log(`[preRender] all components ready — revealing ${element.localName} on GPU`);
		await element.animate(
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
				fill: 'forwards',
			}
		).finished;
		element.style.opacity = '';
		element.style.pointerEvents = '';
		element.style.willChange = '';
		return element;
	}
	static isWebComponent(el) {
		return el?.[WebComponent.WC] === true;
	}
	STATE = {};
	stateProxy = null;
	prevState = null;
	stateWatchers = new Map();
	globalUnsubs = new Set();
	effectUnsubs = new Set();
	templateBuilt = false;
	renderTracking = false;
	renderProxy = null;
	eventHandlers = new Map();
	elementEventNames = new WeakMap();
	activeEventTypes = new Set();
	eventRoot = null;
	renderResolver = null;
	renderComplete = null;
	intervals = new Set();
	get state() {
		if (this.renderTracking) {
			return this.renderProxy;
		}
		return this.stateProxy;
	}
	set state(value) {
		this.setState(value);
	}
	unbindTooltips = null;
	useTooltips = false;
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	constructor(sheets = [], opts = {}) {
		super();
		this[WebComponent.WC] = true;
		this.handleBubbledEvent = this.handleBubbledEvent.bind(this);
		this.useTooltips = opts.tooltips === true;
		this.attachShadow({
			mode: 'open',
		});
		if (sheets.length) {
			this.shadowRoot.adoptedStyleSheets = sheets;
		}
		this.html = makeHtmlTag(this);
		this.initState();
		this.createRenderCompletePromise();
	}
	connectedCallback() {
		register(this);
		const root = this.getRootNode();
		const parentHost = root instanceof ShadowRoot ? root.host : this.parentElement;
		if (WebComponent.isWebComponent(parentHost)) {
			this.unregisterFromParent = registerChild(parentHost, this);
		}
		this.connectDelegatedEvents();
		this.onConnect();
		if (Object.keys(this.STATE).length) {
			this.applyState();
		} else {
			this.refresh();
		}
	}
	disconnectedCallback() {
		unregister(this);
		this.unregisterFromParent?.();
		this.unregisterFromParent = null;
		this.disconnectDelegatedEvents();
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
		this.onDisconnect();
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
		const binding = this.constructor.attrBindings?.[attributeName];
		if (binding) {
			this.state[binding] = newVal;
		}
		this.onAttributeChange(attributeName, oldVal, newVal);
	}
	getComponent(tag) {
		return liveChildren(this, tag.toLowerCase())[0] ?? null;
	}
	getComponents(tag) {
		return liveChildren(this, tag.toLowerCase());
	}
	addStyleSheet(sheet) {
		const root = this.shadowRoot;
		if (root && !root.adoptedStyleSheets.includes(sheet)) {
			root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
		}
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
			return this.watchState(key, (newVal, oldVal, state) => {
				return fn(state, newVal, oldVal);
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
	onRender() {}
	onRenderError(error) {
		console.error(`[${this.localName}] render error:`, error);
	}
	render() {}
	refresh() {
		this.templateBuilt = false;
		this.createRenderCompletePromise();
		this.renderTracking = true;
		this.renderProxy = makeRenderProxy(this.STATE ?? {});
		const seq = ++this.renderSeq;
		try {
			this.render();
		} catch (error) {
			this.onRenderError(error);
		}
		this.renderTracking = false;
		this.renderProxy = null;
		if (seq !== this.renderSeq) {
			return;
		}
		this.syncDelegatedEvents();
		this.renderResolver?.();
		this.renderResolver = null;
		console.log(`[rendered] ${this.localName}`);
		this.onRender();
		if (this.useTooltips) {
			this.unbindTooltips?.();
			this.unbindTooltips = null;
			attachTooltips(this.getComponentRoot()).then((unbind) => {
				this.unbindTooltips = unbind;
			});
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
		return typeof target === 'string' ? document.querySelector(target) : target;
	}
	appendTo(target) {
		return this.resolve(target)?.appendChild(this);
	}
	prependTo(target) {
		return this.resolve(target)?.prepend(this);
	}
}
Object.assign(WebComponent.prototype, stateMethods, eventMethods, globalMethods);
window.WebComponent = WebComponent;
