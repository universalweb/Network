import {
	clearUnsubs,
	fireResolver,
	isPromiseLike,
	syncSubsByDiff,
} from '../utilities.js';
import { makeProxy, setCurrentTracking } from '../state/binding.js';
import { allChildren } from '../dom/children.js';
import { Logger } from '../debug/logger.js';
import { nextFrame } from '../lifecycle/scheduler.js';
import { scanAndResolve } from '../resolver.js';
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
		childPromises.push(children[i].lifecycle[fieldName]);
	}
	await Promise.all(childPromises);
}
export function finishRender(resolver) {
	resolver();
	if (this.lifecycle.whenRenderedResolver === resolver) {
		this.lifecycle.whenRenderedResolver = null;
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
export async function renderView() {
	this.templateBuilt = false;
	const sequence = ++this.renderSeq;
	if (!this.lifecycle.whenRenderedResolver) {
		this.lifecycle.whenRendered = new Promise((resolve) => {
			this.lifecycle.whenRenderedResolver = resolve;
		});
	}
	const renderedResolver = this.lifecycle.whenRenderedResolver;
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
		// Dependency tracking spans only the synchronous body of render().
		// currentTracking is module-global, so it is cleared before any await
		// yields — otherwise an interleaving component's render absorbs, or is
		// absorbed into, the wrong dep set. A synchronous throw from render()
		// skips this line but is caught by the outer finally, which clears it
		// too. If render() is async, reads after its first await are untracked
		// by design; do async prep in beforeRender instead.
		setCurrentTracking(renderDeps);
		const renderResult = this.render?.();
		setCurrentTracking(null);
		if (isPromiseLike(renderResult)) {
			Logger.debug(this.constructor.name, () => {
				return `[${this.tagName}] async render(): reads after the first await are untracked — move async work to beforeRender`;
			});
			await renderResult;
		}
		if (sequence !== this.renderSeq) {
			this.isRendering = false;
			this.finishRender(renderedResolver);
			return;
		}
		// Fire-and-forget: lazy-load any undefined custom elements this render
		// produced. Non-blocking so the parent's whenRendered doesn't wait —
		// lazy children upgrade on their own once their module lands.
		scanAndResolve(this.shadowRoot);
	} finally {
		// Safety net: a synchronous throw from render() skips the inline clear.
		setCurrentTracking(null);
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
		fireResolver(this.lifecycle, 'whenMounted');
		return;
	}
	await this.onMount?.();
	if (this.phase === 'rendered') {
		this.phase = 'mounted';
	}
	fireResolver(this.lifecycle, 'whenMounted');
}
export async function handleLive() {
	await nextFrame();
	if (!this.isConnected) {
		fireResolver(this.lifecycle, 'whenLive');
		return;
	}
	this.classList.remove('mounting');
	await awaitChildren(this, 'whenLive');
	if (!this.isConnected) {
		fireResolver(this.lifecycle, 'whenLive');
		return;
	}
	await this.onLive?.();
	if (this.phase === 'mounted') {
		this.phase = 'live';
	}
	fireResolver(this.lifecycle, 'whenLive');
	this.installObserver();
}
