import { Binding, makeProxy, setCurrentTracking } from '../state/binding.js';
import {
	clearUnsubs,
	fireResolver,
	isPromiseLike,
	syncSubsByDiff,
} from '../utilities.js';
import { allChildren } from '../dom/children.js';
import { Logger } from '../debug/logger.js';
import { nextFrame } from '../lifecycle/scheduler.js';
async function awaitChildren(component, fieldName) {
	if (component.config?.fastLifecycle === true) {
		return;
	}
	const children = allChildren(component);
	if (!children.length) {
		return;
	}
	const childPromises = [];
	for (let i = 0; i < children.length; i++) {
		childPromises.push(children[i][fieldName]);
	}
	await Promise.all(childPromises);
}
export async function render() {}
export function finishRender(resolver) {
	resolver();
	if (this.whenRenderedResolver === resolver) {
		this.whenRenderedResolver = null;
	}
}
export function invalidateRender() {
	this.templateBuilt = false;
	if (this.isConnected) {
		this.updateView();
	}
}
export function subscribeRenderDeps(deps) {
	if (!deps || deps.size === 0) {
		clearUnsubs(this.renderDepUnsubs);
		return;
	}
	const component = this;
	if (!this.boundInvalidateRender) {
		this.boundInvalidateRender = this.invalidateRender.bind(this);
	}
	const invalidate = this.boundInvalidateRender;
	syncSubsByDiff(this.renderDepUnsubs, deps, (dep) => {
		if (dep.startsWith('global.')) {
			return component.watchGlobal ? component.watchGlobal(dep.slice(7), invalidate) : (() => {});
		}
		return component.watchState ? component.watchState(dep, invalidate) : (() => {});
	});
}
export function bind(key, currentValue) {
	return new Binding(String(key ?? ''), currentValue);
}
export async function renderView() {
	this.templateBuilt = false;
	const sequence = ++this.renderSeq;
	if (this.whenRenderedResolver === null) {
		this.whenRendered = new Promise((resolve) => {
			this.whenRenderedResolver = resolve;
		});
	}
	const renderedResolver = this.whenRenderedResolver;
	const renderDeps = new Set();
	const wasFirstRender = !this.firstRenderDone;
	this.isRendering = true;
	let renderSkipped = false;
	try {
		if (this.beforeRender) {
			const beforeResult = this.beforeRender();
			if (isPromiseLike(beforeResult)) {
				const awaitedResult = await beforeResult;
				if (awaitedResult === false) {
					renderSkipped = true;
				}
			} else if (beforeResult === false) {
				renderSkipped = true;
			}
		}
		if (sequence !== this.renderSeq) {
			this.isRendering = false;
			this.finishRender(renderedResolver);
			return;
		}
		if (renderSkipped) {
			this.isRendering = false;
			this.finishRender(renderedResolver);
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
			this.isRendering = false;
			this.finishRender(renderedResolver);
			return;
		}
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
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedResolver);
		return;
	}
	this.templateBuilt = true;
	await this.onRender?.();
	Logger.debug(this.constructor.name, () => {
		return `[${this.tagName}] onRender called`;
	});
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedResolver);
		return;
	}
	await this.handleRendered(sequence, wasFirstRender, renderedResolver);
	if (!wasFirstRender) {
		this.isRendering = false;
		return;
	}
	this.firstRenderDone = true;
	this.isRendering = false;
	await this.handleMount();
	await this.handleLive();
}
export async function handleRendered(sequence, wasFirstRender, renderedResolver) {
	await awaitChildren(this, 'whenRendered');
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedResolver);
		return;
	}
	await this.onRendered?.();
	if (wasFirstRender && this.phase === 'connected') {
		this.phase = 'rendered';
	}
	this.finishRender(renderedResolver);
}
export async function handleMount() {
	await awaitChildren(this, 'whenMounted');
	if (!this.isConnected) {
		fireResolver(this, 'whenMounted');
		return;
	}
	await this.onMount?.();
	if (this.phase === 'rendered') {
		this.phase = 'mounted';
	}
	fireResolver(this, 'whenMounted');
}
export async function handleLive() {
	await nextFrame();
	if (!this.isConnected) {
		fireResolver(this, 'whenLive');
		return;
	}
	this.classList.remove('mounting');
	await awaitChildren(this, 'whenLive');
	if (!this.isConnected) {
		fireResolver(this, 'whenLive');
		return;
	}
	await this.onLive?.();
	if (this.phase === 'mounted') {
		this.phase = 'live';
	}
	fireResolver(this, 'whenLive');
	this.installObserver();
}
