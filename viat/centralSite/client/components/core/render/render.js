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
import { Perf } from '../debug/perf.js';
import { allChildren } from '../dom/children.js';
import { ensureStateBus } from '../state/state.js';
import { globalState } from '../state/globalState.js';
import { nextFrame, queueGlobalRender } from '../lifecycle/scheduler.js';
import { scanAndResolve } from '../resolver.js';
// Returns `undefined` when no children to await (sync fast path for leaf
// components), otherwise returns a Promise. Callers must check before
// awaiting: `const p = awaitChildren(...); if (p) await p;` — bare `await
// undefined` would queue a wasted microtask per call.
function awaitChildren(component, fieldName) {
	if (component.config?.fastLifecycle === true) {
		return undefined;
	}
	const children = allChildren(component);
	if (!children.length) {
		return undefined;
	}
	const childPromises = new Array(children.length);
	for (let i = 0; i < children.length; i++) {
		childPromises[i] = children[i].lifecycle[fieldName];
	}
	return Promise.all(childPromises);
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
// Global renderDep marker. The SHARED global bus has no onFlush→updateView hook
// (one bus, every component), so a global renderDep both flips the patch-pass
// flag AND enqueues this component for the once-per-flush drainGlobalRenders
// kick. Local renderDeps use plain markRenderDirty because their per-component
// bus's onFlush already calls updateView.
export function markRenderDirtyGlobal() {
	this.templateBuilt = false;
	this.renderDepDirty = true;
	queueGlobalRender(this);
}
// Module-scope, signature ordered as (key, context) so it slots directly into
// syncSubsByDiff's `subscribe(key, context)` contract — the component is the
// per-call context, passed as the 4th arg of syncSubsByDiff with zero wrapper
// allocations.
function subscribeRenderDep(dep, component) {
	if (dep.startsWith('global.')) {
		return globalState.bus.subscribe(dep.slice(7), component.markRenderDirtyGlobal, component);
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
	const perfMark = Perf.mark('renderView');
	try {
		this.templateBuilt = false;
		const sequence = ++this.renderSeq;
		if (!this.lifecycle.whenRenderedResolver) {
			const deferred = Promise.withResolvers();
			this.lifecycle.whenRendered = deferred.promise;
			this.lifecycle.whenRenderedResolver = deferred.resolve;
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
				if (Logger.debugOn) {
					Logger.debug(this.constructor.name, `[${this.tagName}] async render(): reads after the first await are untracked — move async work to beforeRender`);
				}
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
			scanAndResolve(this.shadowRoot ?? this);
		} finally {
		// Safety net: a synchronous throw from render() skips the inline clear.
			setCurrentTracking(null);
			if (sequence === this.renderSeq) {
				this.renderTracking = false;
				const boundKeys = this.tplBoundKeys;
				if (boundKeys && boundKeys.size) {
				// `Set.prototype.delete` is the iteratee; `renderDeps` is the
				// thisArg the browser binds it to. Zero arrow allocation per
				// render — the per-render alloc is the dominant cost here.
					boundKeys.forEach(renderDeps.delete, renderDeps);
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
			if (Logger.debugOn) {
				Logger.debug(this.constructor.name, `[${this.tagName}] patch pass (no re-render)`);
			}
			return;
		}
		// Optional lifecycle hooks: `await this.onRender?.()` used to queue
		// one microtask per instance even when the hook was undefined (the
		// `await undefined` pattern). For 500 leaf components without
		// onRender/onRendered/onMount, that was ~3 wasted microtasks each
		// = ~75ms across the list. Skip the await when the hook is missing
		// or returns a non-thenable.
		if (this.onRender) {
			const onRenderResult = this.onRender();
			if (onRenderResult && typeof onRenderResult.then === 'function') {
				await onRenderResult;
			}
		}
		if (Logger.debugOn) {
			Logger.debug(this.constructor.name, `[${this.tagName}] onRender called`);
		}
		if (sequence !== this.renderSeq) {
			this.finishRender(renderedResolver);
			return;
		}
		const renderedResult = this.handleRendered(sequence, wasFirstRender, renderedResolver);
		if (renderedResult && typeof renderedResult.then === 'function') {
			await renderedResult;
		}
		if (!wasFirstRender) {
			this.isRendering = false;
			return;
		}
		this.firstRenderDone = true;
		this.isRendering = false;
		const mountResult = this.handleMount();
		if (mountResult && typeof mountResult.then === 'function') {
			await mountResult;
		}
		const liveResult = this.handleLive();
		if (liveResult && typeof liveResult.then === 'function') {
			await liveResult;
		}
	} finally {
		Perf.measure('renderView', perfMark);
	}
}
// Returns undefined when the body completes synchronously (no children to
// await, no async onRendered hook); otherwise returns a Promise. The
// async tail is split into `handleRenderedAsync` so the fast path stays
// a non-Promise return — caller checks before awaiting.
export function handleRendered(sequence, wasFirstRender, renderedResolver) {
	const childPromise = awaitChildren(this, LIFECYCLE_PROMISE.RENDERED);
	if (childPromise) {
		return handleRenderedAsync(this, sequence, wasFirstRender, renderedResolver, childPromise);
	}
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedResolver);
		return undefined;
	}
	if (this.onRendered) {
		const result = this.onRendered();
		if (result && typeof result.then === 'function') {
			return handleRenderedAsyncTail(this, sequence, wasFirstRender, renderedResolver, result);
		}
	}
	if (wasFirstRender && this.phase === PHASE.CONNECTED) {
		this.phase = PHASE.RENDERED;
	}
	this.finishRender(renderedResolver);
	return undefined;
}
async function handleRenderedAsync(component, sequence, wasFirstRender, renderedResolver, childPromise) {
	await childPromise;
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedResolver);
		return;
	}
	if (component.onRendered) {
		const result = component.onRendered();
		if (result && typeof result.then === 'function') {
			await result;
		}
	}
	if (wasFirstRender && component.phase === PHASE.CONNECTED) {
		component.phase = PHASE.RENDERED;
	}
	component.finishRender(renderedResolver);
}
async function handleRenderedAsyncTail(component, sequence, wasFirstRender, renderedResolver, onRenderedResult) {
	await onRenderedResult;
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedResolver);
		return;
	}
	if (wasFirstRender && component.phase === PHASE.CONNECTED) {
		component.phase = PHASE.RENDERED;
	}
	component.finishRender(renderedResolver);
}
// Same pattern for handleMount: skip async wrapping when no children +
// no onMount hook. Returns undefined or Promise.
export function handleMount() {
	const childPromise = awaitChildren(this, LIFECYCLE_PROMISE.MOUNTED);
	if (childPromise) {
		return handleMountAsync(this, childPromise);
	}
	if (!this.isConnected) {
		fireResolver(this.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
		return undefined;
	}
	if (this.onMount) {
		const result = this.onMount();
		if (result && typeof result.then === 'function') {
			return handleMountAsyncTail(this, result);
		}
	}
	if (this.phase === PHASE.RENDERED) {
		this.phase = PHASE.MOUNTED;
	}
	fireResolver(this.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
	return undefined;
}
async function handleMountAsync(component, childPromise) {
	await childPromise;
	if (!component.isConnected) {
		fireResolver(component.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
		return;
	}
	if (component.onMount) {
		const result = component.onMount();
		if (result && typeof result.then === 'function') {
			await result;
		}
	}
	if (component.phase === PHASE.RENDERED) {
		component.phase = PHASE.MOUNTED;
	}
	fireResolver(component.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
}
async function handleMountAsyncTail(component, onMountResult) {
	await onMountResult;
	if (component.phase === PHASE.RENDERED) {
		component.phase = PHASE.MOUNTED;
	}
	fireResolver(component.lifecycle, LIFECYCLE_PROMISE.MOUNTED);
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
