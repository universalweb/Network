import {
	assignPromisePair,
	clearUnsubs,
	fireResolver,
	isShadowRoot,
} from '../utilities.js';
import { register, unregister } from '../dom/registry.js';
import { Logger } from '../debug/logger.js';
import { registerChild } from '../dom/children.js';
const CONNECT_CYCLE_KEYS = [
	'whenConnected',
	'whenRendered',
	'whenMounted',
	'whenLive',
	'whenVisible',
	'whenDisconnected',
];
const STRANDED_CYCLE_KEYS = [
	'whenConnected',
	'whenRendered',
	'whenMounted',
	'whenLive',
	'whenVisible',
];
function attachToParent(component, parentHost) {
	if (parentHost && parentHost.isWebComponent) {
		component.parentComponent = parentHost;
		component.unregisterFromParent = registerChild(parentHost, component);
		return;
	}
	component.parentComponent = null;
}
function resolveParentHost(component) {
	const root = component.getRootNode();
	return isShadowRoot(root) ? root.host : component.parentElement;
}
function runLifecycleStep(component, handlerName, label) {
	return component[handlerName]().catch((error) => {
		Logger.error('WebComponent', `[${component.tagName}] ${label} error:`, error);
		component.onLifecycleError(error);
	});
}
export function connectedCallback() {
	if (!this.firstRenderDone) {
		this.classList.add('mounting');
	}
	this.pendingConnect = runLifecycleStep(this, 'handleConnect', 'Connected');
}
export function connectedMoveCallback() {
	runLifecycleStep(this, 'handleMove', 'Move');
}
export function disconnectedCallback() {
	runLifecycleStep(this, 'handleDisconnect', 'Disconnected');
}
export function attributeChangedCallback(attrName, oldValue, newValue) {
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
export async function handleConnect() {
	register(this);
	Logger.debug('WebComponent', () => {
		return `[${this.tagName}] connectedCallback`;
	});
	attachToParent(this, resolveParentHost(this));
	await this.applyStyles();
	await this.onConnect?.();
	this.phase = 'connected';
	fireResolver(this.lifecycle, 'whenConnected');
	if (Object.keys(this.STATE).length) {
		await this.updateView();
	} else {
		await this.renderView();
	}
}
export async function handleMove() {
	Logger.debug('WebComponent', () => {
		return `[${this.tagName}] connectedMoveCallback`;
	});
	const oldParent = this.parentComponent;
	this.unregisterFromParent?.();
	this.unregisterFromParent = null;
	attachToParent(this, resolveParentHost(this));
	await this.onMove?.(oldParent, this.parentComponent);
}
export async function handleDisconnect() {
	await this.pendingConnect;
	this.pendingConnect = null;
	unregister(this);
	Logger.debug('WebComponent', () => {
		return `[${this.tagName}] disconnectedCallback`;
	});
	this.unregisterFromParent?.();
	this.unregisterFromParent = null;
	this.parentComponent = null;
	this.uninstallObserver();
	this.visibleFired = false;
	this.isIntersecting = false;
	this.isIntersected = false;
	this.isVisible = false;
	this.clearTimeouts();
	this.clearIntervals();
	clearUnsubs(this.stateUnsubs);
	clearUnsubs(this.globalUnsubs);
	clearUnsubs(this.delegateUnsubs);
	this.attrObservers = null;
	this.refsMap = null;
	this.refsProxy = null;
	this.cleanupTemplate();
	this.templateBuilt = false;
	this.firstRenderDone = false;
	this.isRendering = false;
	clearUnsubs(this.renderDepUnsubs);
	this.clearEventListeners();
	this.resolveStrandedConnectCyclePromises();
	await this.onDisconnect?.();
	this.phase = 'disconnected';
	fireResolver(this.lifecycle, 'whenDisconnected');
	this.createConnectCyclePromises();
	if (this.pendingDestroy) {
		await this.handleDestroy();
	}
}
export async function handleDestroy() {
	await this.onDestroy?.();
	this.phase = 'destroyed';
	fireResolver(this.lifecycle, 'whenDestroyed');
}
export function destroy() {
	if (this.phase === 'destroyed') {
		return this.lifecycle.whenDestroyed;
	}
	this.pendingDestroy = true;
	if (this.isConnected) {
		this.remove();
	} else {
		this.handleDestroy().catch((error) => {
			this.onLifecycleError(error);
		});
	}
	return this.lifecycle.whenDestroyed;
}
export function resolveStrandedConnectCyclePromises() {
	for (let i = 0; i < STRANDED_CYCLE_KEYS.length; i++) {
		fireResolver(this.lifecycle, STRANDED_CYCLE_KEYS[i]);
	}
	this.lifecycle.treeVisiblePromise = null;
}
export function createConnectCyclePromises() {
	for (let i = 0; i < CONNECT_CYCLE_KEYS.length; i++) {
		assignPromisePair(this.lifecycle, CONNECT_CYCLE_KEYS[i]);
	}
	this.lifecycle.treeVisiblePromise = null;
}
export function createWhenDestroyedPromise() {
	assignPromisePair(this.lifecycle, 'whenDestroyed');
}
