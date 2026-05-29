import {
	clearUnsubs,
	fireResolver,
	isPromiseLike,
	syncSubsByDiff,
} from '../utilities.js';
import { makeProxy, setCurrentTracking } from '../state/binding.js';
import { LIFECYCLE_PROMISE } from '../lifecycle/lifecycle.js';
import { Logger } from '../debug/logger.js';
import { PHASE } from '../lifecycle/phase.js';
import { allChildren } from '../dom/children.js';
import { ensureStateBus } from '../state/state.js';
import { globalState } from '../state/globalState.js';
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
	// Explicit force-render — clear the patch flag so the render runs the
	// full structural lifecycle (onRender / onRendered / awaitChildren).
	this.renderDepDirty = false;
	if (this.isConnected) {
		this.updateView();
	}
}
// Renderdep dirty-marker. Promoted from a module-scope function (which had to
// be `.bind`-ed per component to capture `this`) to a `WebComponent.prototype`
// method — the path bus now supports a `target` for `handler.call(target, …)`,
// so a single shared prototype reference + per-subscription target replaces
// the per-component bound closure. Zero `.bind`, zero per-component allocation.
export function markRenderDirty() {
	this.templateBuilt = false;
	// A tracked renderDep changed — the next renderView is a PATCH PASS:
	// render() re-runs and updateTemplateSpots patches the spots in place,
	// but the structural lifecycle is skipped. See renderView's isPatchPass.
	this.renderDepDirty = true;
}
// Module-scope, signature ordered as (key, context) so it slots directly into
// syncSubsByDiff's `subscribe(key, context)` contract — the component is the
// per-call context, passed as the 4th arg of syncSubsByDiff with zero wrapper
// allocations.
function subscribeRenderDep(dep, component) {
	if (dep.startsWith('global.')) {
		return globalState.bus.subscribe(dep.slice(7), component.markRenderDirty, component);
	}
	return ensureStateBus(component).subscribe(dep, component.markRenderDirty, component);
}
export function subscribeRenderDeps(deps) {
	if (!deps || deps.size === 0) {
		clearUnsubs(this.renderDepUnsubs);
		return;
	}
	// Renderdep subscribers only need to flip the dirty flag — the path bus
	// calls `onFlush → updateView` at the end of every flush, so the actual
	// renderView is scheduled there exactly once per flush. If each
	// subscriber called `updateView` itself (as `invalidateRender` does for
	// external callers), N renderDeps firing in one flush would each kick
	// off a sync `renderView` pass, with the `renderSeq` check finally
	// bailing every pass except the last — wasted `render()` invocations
	// and wasted spot-diff work that produced no DOM. The external
	// `invalidateRender` keeps its full semantics for explicit force-render
	// callers.
	syncSubsByDiff(this.renderDepUnsubs, deps, subscribeRenderDep, this);
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
	// A patch pass is a re-render triggered purely by a tracked renderDep
	// (a bare `${this.state.x}` read). render() still re-runs so
	// updateTemplateSpots can patch the changed spots in place — but the
	// structural lifecycle (onRender, onRendered, awaitChildren) is skipped:
	// those exist for first render and explicit invalidateRender only.
	const isPatchPass = !wasFirstRender && this.renderDepDirty === true;
	this.renderDepDirty = false;
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
	if (isPatchPass) {
		// Spots already patched in place by updateTemplateSpots; renderDeps
		// re-subscribed in the finally above. No structural lifecycle.
		this.isRendering = false;
		this.finishRender(renderedResolver);
		Logger.debug(this.constructor.name, () => {
			return `[${this.tagName}] patch pass (no re-render)`;
		});
		return;
	}
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
	await awaitChildren(this, LIFECYCLE_PROMISE.RENDERED);
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedResolver);
		return;
	}
	await this.onRendered?.();
	if (wasFirstRender && this.phase === PHASE.CONNECTED) {
		this.phase = PHASE.RENDERED;
	}
	this.finishRender(renderedResolver);
}
export async function handleMount() {
	await awaitChildren(this, LIFECYCLE_PROMISE.MOUNTED);
	if (!this.isConnected) {
		fireResolver(this.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
		return;
	}
	await this.onMount?.();
	if (this.phase === PHASE.RENDERED) {
		this.phase = PHASE.MOUNTED;
	}
	fireResolver(this.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
}
export async function handleLive() {
	await nextFrame();
	if (!this.isConnected) {
		fireResolver(this.lifecycle, LIFECYCLE_PROMISE.LIVE);
		return;
	}
	this.classList.remove('mounting');
	await awaitChildren(this, LIFECYCLE_PROMISE.LIVE);
	if (!this.isConnected) {
		fireResolver(this.lifecycle, LIFECYCLE_PROMISE.LIVE);
		return;
	}
	await this.onLive?.();
	if (this.phase === PHASE.MOUNTED) {
		this.phase = PHASE.LIVE;
	}
	fireResolver(this.lifecycle, LIFECYCLE_PROMISE.LIVE);
	this.installObserver();
}
