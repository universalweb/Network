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
import { localRealm } from '../state/state.js';
import { nextFrame, queueGlobalRender } from '../lifecycle/scheduler.js';
import { scanAndResolve } from '../resolver.js';
/**
 * Await a lifecycle phase across a component's children. Returns `undefined`
 * when there are no children to await (sync fast path for leaf components),
 * otherwise a Promise. Callers MUST check before awaiting
 * (`const p = awaitChildren(...); if (p) await p;`) — a bare `await undefined`
 * queues a wasted microtask per call.
 * @param {WebComponent} component - The parent component.
 * @param {string} fieldName - The lifecycle promise field to await on each child.
 * @returns {Promise<unknown[]>|undefined} A Promise, or undefined when no children.
 */
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
	/*
	 * Explicit force-render — clear the patch flag so the render runs the
	 * full structural lifecycle (onRender / onRendered / awaitChildren).
	 */
	this.renderDepDirty = false;
	if (this.isConnected) {
		this.updateView();
	}
}
/**
 * Renderdep dirty-marker. Promoted from a module-scope function (which had to
 * be `.bind`-ed per component to capture `this`) to a `WebComponent.prototype`
 * method — the path bus now supports a `target` for `handler.call(target, …)`,
 * so a single shared prototype reference + per-subscription target replaces
 * the per-component bound closure. Zero `.bind`, zero per-component allocation.
 */
export function markRenderDirty() {
	this.templateBuilt = false;
	/*
	 * A tracked renderDep changed — the next renderView is a PATCH PASS:
	 * render() re-runs and updateTemplateSpots patches the spots in place,
	 * but the structural lifecycle is skipped. See renderView's isPatchPass.
	 */
	this.renderDepDirty = true;
}
/**
 * Global renderDep dirty-marker. The shared global bus has no
 * `onFlush → updateView` hook (one bus serves every component), so a global
 * renderDep both flips the patch-pass flag AND enqueues this component for the
 * once-per-flush `drainGlobalRenders` kick. Local renderDeps use plain
 * `markRenderDirty` because their per-component bus's onFlush already calls
 * updateView.
 */
export function markRenderDirtyGlobal() {
	this.templateBuilt = false;
	this.renderDepDirty = true;
	queueGlobalRender(this);
}
/**
 * Subscribe one bare path to its realm's bus. `ctx` carries the realm (its bus
 * + global flag → which dirty marker) and the component (bus target for
 * `handler.call(target)`). Slots into syncSubsByDiff's `subscribe(key, context)`
 * contract — no string parsing, routing is by realm reference.
 * @param {string} path - The bare state path to subscribe.
 * @param {{realm: object, handler: Function, component: WebComponent}} ctx - Subscription context.
 * @returns {Subscription} The created subscription.
 */
function subscribeRealmDep(path, ctx) {
	return ctx.realm.bus.subscribe(path, ctx.handler, ctx.component);
}
/**
 * `deps` is now a Map<realm, Set<path>> — local / global / private channels
 * kept separate, never co-mingled into a prefixed flat set. Each realm's paths
 * diff against their own submap in the 2-level `renderDepUnsubs`
 * (Map<realm, Map<path, unsub>>). Renderdep subscribers only flip the dirty
 * flag — the bus's `onFlush → updateView` schedules the single renderView per
 * flush (a global dep additionally enqueues drainGlobalRenders via
 * markRenderDirtyGlobal, since the shared global bus has no per-component
 * onFlush). `invalidateRender` keeps full force-render semantics.
 */
export function subscribeRenderDeps(deps) {
	const store = this.renderDepUnsubs;
	// Dispose realms that vanished from this render (e.g. stopped reading global).
	if (store.size) {
		const realms = [...store.keys()];
		for (let realmIndex = 0; realmIndex < realms.length; realmIndex++) {
			const realm = realms[realmIndex];
			if (!deps || !deps.has(realm)) {
				clearUnsubs(store.get(realm));
				store.delete(realm);
			}
		}
	}
	if (!deps || deps.size === 0) {
		return;
	}
	const entries = [...deps];
	for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
		const realm = entries[entryIndex][0];
		const paths = entries[entryIndex][1];
		let submap = store.get(realm);
		if (!submap) {
			submap = new Map();
			store.set(realm, submap);
		}
		const handler = realm.global ? this.markRenderDirtyGlobal : this.markRenderDirty;
		syncSubsByDiff(submap, paths, subscribeRealmDep, {
			realm,
			handler,
			component: this,
		});
	}
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
		const renderDeps = new Map();
		const wasFirstRender = !this.firstRenderDone;
		/*
		 * A patch pass is a re-render triggered purely by a tracked renderDep
		 * (a bare `${this.state.x}` read). render() still re-runs so
		 * updateTemplateSpots can patch the changed spots in place — but the
		 * structural lifecycle (onRender, onRendered, awaitChildren) is skipped:
		 * those exist for first render and explicit invalidateRender only.
		 */
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
			/*
			 * Dependency tracking spans only the synchronous body of render().
			 * currentTracking is module-global, so it is cleared before any await
			 * yields — otherwise an interleaving component's render absorbs, or is
			 * absorbed into, the wrong dep set. A synchronous throw from render()
			 * skips this line but is caught by the outer finally, which clears it
			 * too. If render() is async, reads after its first await are untracked
			 * by design; do async prep in beforeRender instead.
			 */
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
			/*
			 * Fire-and-forget: lazy-load any undefined custom elements this render
			 * produced. Non-blocking so the parent's whenRendered doesn't wait —
			 * lazy children upgrade on their own once their module lands.
			 */
			scanAndResolve(this.shadowRoot ?? this);
		} finally {
		// Safety net: a synchronous throw from render() skips the inline clear.
			setCurrentTracking(null);
			if (sequence === this.renderSeq) {
				this.renderTracking = false;
				const boundKeys = this.tplBoundKeys;
				if (boundKeys && boundKeys.size) {
				/*
				 * Two-way-bound keys are LOCAL state paths; drop them from the
				 * local realm's path set so the renderDep and the $value spot
				 * don't double-subscribe. `Set.prototype.delete` is the iteratee,
				 * the local path set its thisArg — zero arrow allocation.
				 */
					const localPaths = renderDeps.get(localRealm(this));
					if (localPaths) {
						boundKeys.forEach(localPaths.delete, localPaths);
					}
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
		/*
		 * Spots already patched in place by updateTemplateSpots; renderDeps
		 * re-subscribed in the finally above. No structural lifecycle.
		 */
			this.isRendering = false;
			this.finishRender(renderedResolver);
			if (Logger.debugOn) {
				Logger.debug(this.constructor.name, `[${this.tagName}] patch pass (no re-render)`);
			}
			return;
		}
		/**
		 * Optional lifecycle hooks: `await this.onRender?.()` used to queue
		 * one microtask per instance even when the hook was undefined (the
		 * `await undefined` pattern). For 500 leaf components without
		 * onRender/onRendered/onMount, that was ~3 wasted microtasks each
		 * = ~75ms across the list. Skip the await when the hook is missing
		 * or returns a non-thenable.
		 */
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
/**
 * Run the post-render lifecycle. Returns undefined when the body completes
 * synchronously (no children to await, no async onRendered hook); otherwise a
 * Promise. The async tail is split into `handleRenderedAsync` so the fast path
 * stays a non-Promise return — the caller checks before awaiting.
 * @param {number} sequence - The render sequence this pass belongs to.
 * @param {boolean} wasFirstRender - True on the component's first render.
 * @param {Function} renderedResolver - Resolves the `whenRendered` promise.
 * @returns {Promise<void>|undefined} A Promise when async work is pending, else undefined.
 */
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
/**
 * Run the mount lifecycle. Mirrors `handleRendered` — skips the async wrapper
 * when there are no children and no onMount hook.
 * @returns {Promise<void>|undefined} A Promise when async work is pending, else undefined.
 */
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
