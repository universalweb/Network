import { defaultLogger } from '../debug/logger.js';
import { Perf } from '../debug/perf.js';
import { allChildren } from '../dom/children.js';
import { LIFECYCLE_PROMISE } from '../lifecycle/lifecycle.js';
import { PHASE } from '../lifecycle/phase.js';
import { nextFrame, queueGlobalRender } from '../lifecycle/scheduler.js';
import { scanAndResolve } from '../resolver.js';
import { ensureRenderProxies, setCurrentTracking } from '../state/binding.js';
import { localRealm } from '../state/state.js';
import {
	clearUnsubs,
	emitError,
	isPromiseLike,
	syncSubsByDiff,
} from '../utilities.js';
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
	const childrenLength = children.length;
	for (let childIndex = 0; childIndex < childrenLength; childIndex++) {
		childPromises[childIndex] = children[childIndex].lifecycle[fieldName];
	}
	return Promise.all(childPromises);
}
/**
 * Settle this pass's `whenRendered` slot. The epoch captured at pass start is
 * the pass-ownership token: a stale epoch (the slot settled and re-armed for a
 * newer pass since) no-ops inside `fireRendered`, exactly like the old
 * captured-resolver identity guard — with no per-pass deferred allocation.
 * @param {number} renderedEpoch - The epoch captured at the pass's start.
 */
export function finishRender(renderedEpoch) {
	this.lifecycle.fireRendered(renderedEpoch);
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
	 * but the structural lifecycle is skipped. See renderPass's isPatchPass.
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
	/*
	 * Dispose NON-LOCAL realms that vanished from this render (e.g. stopped
	 * reading global). The local realm never enters `store` — it lives on the
	 * bus's Set channel below. Map delete-during-iteration is spec-safe; no
	 * user code runs mid-loop (dispose → Subscription.unsubscribe only).
	 */
	if (store.size) {
		for (const [
			realm,
			submap,
		] of store) {
			if (!deps || !deps.has(realm)) {
				clearUnsubs(submap);
				store.delete(realm);
			}
		}
	}
	/*
	 * LOCAL deps route to the bus's Set channel — no Subscription objects, no
	 * buckets, no submap (see ComponentStateBus.syncRenderDeps). A pass with
	 * no local deps must still SYNC (clear) a previously populated channel,
	 * so the local set is picked out first and synced once at the end.
	 */
	const localBus = this.stateBus;
	let localPaths = null;
	if (deps && deps.size) {
		for (const [
			realm,
			paths,
		] of deps) {
			if (localBus !== null && realm.bus === localBus) {
				localPaths = paths;
				continue;
			}
			let submap = store.get(realm);
			if (!submap) {
				submap = new Map();
				store.set(realm, submap);
			}
			const handler = realm.sharedBus ? this.markRenderDirtyGlobal : this.markRenderDirty;
			syncSubsByDiff(submap, paths, subscribeRealmDep, {
				realm,
				handler,
				component: this,
			});
		}
	}
	if (localBus !== null) {
		localBus.syncRenderDeps(localPaths);
	}
}
/**
 * Typed render-pass failure. A hook that throws or rejects must surface as a
 * RETURN VALUE, never as a rejection of renderView's promise — an unsettled
 * `whenRendered` wedges every ancestor's awaitChildren(...) forever. Async
 * rejections convert at their await sites via `.then(undefined,
 * onRenderRejected)`; a synchronous hook throw rejects renderPass's promise
 * and converts once at renderView's boundary, so the ASYNC path needs no
 * try/catch — the fulfilled path is straight-line control flow.
 *
 * The sync fast path (patchPassSync) sits OUTSIDE this machinery by the
 * failure contract: it has no async boundary, so a throwing render() body
 * propagates raw to the caller (app bug, app stack, fail fast) — patchPassSync
 * orders its mutations so that raw throw can wedge nothing.
 */
class RenderFailure {
	constructor(reason) {
		this.reason = reason;
	}
	static is(value) {
		return value instanceof RenderFailure;
	}
}
function onRenderRejected(reason) {
	return new RenderFailure(reason);
}
/**
 * Terminal bookkeeping for a failed pass: settle `whenRendered` and release
 * the mount/live gates so ancestors awaiting this child proceed instead of
 * hanging, THEN report through the `renderError` event channel (emitError —
 * preventDefault marks handled, unprevented rethrows raw). Gates fire FIRST
 * so a throwing app error-listener cannot wedge them. The gate fires are
 * unconditional because a settled slot's fire is a no-op — cheaper and safer
 * than guessing which gates this pass owed (`firstRenderDone` flips mid-pass
 * before handleMount). A failed first render leaves
 * `firstRenderDone`/`templateBuilt` false, so the next state write or
 * invalidateRender re-runs the full first-render lifecycle — the phase ladder
 * heals itself on the first successful pass.
 */
function failRenderPass(component, renderedEpoch, reason) {
	component.finishRender(renderedEpoch);
	component.lifecycle.fireMounted();
	component.lifecycle.fireLive();
	emitError(component, 'renderError', reason);
}
/**
 * Boundary recovery for a hook that threw SYNCHRONOUSLY (a render/onRendered/
 * onMount body before its first await). Tracking windows are synchronous, so
 * at this microtask the module-global can only be this pass's leftover —
 * clear it unconditionally. The CURRENT epoch stands in for the pass's local
 * binding (unreachable here): if the slot already settled, fireRendered
 * no-ops on state, the old null-resolver tolerance.
 */
function recoverRenderPass(component, reason) {
	setCurrentTracking(null);
	component.renderTracking = false;
	failRenderPass(component, component.lifecycle.renderedEpoch, reason);
}
/**
 * Is this pass eligible for the synchronous fast path? Every condition is a
 * settled fact by the time a renderDep fires, so the answer costs four reads:
 * the component has rendered at least once (`renderIsSync` is only meaningful
 * after that), this pass was triggered purely by a tracked dep, render() is
 * known-synchronous, and there is no `beforeRender` hook to await. A component
 * WITH beforeRender simply takes the async path, where that hook still runs —
 * eligibility narrows the fast lane, it never skips work.
 * @param {WebComponent} component - The component about to render.
 * @returns {boolean} True when the pass can run start-to-finish synchronously.
 */
function canPatchSync(component) {
	return component.firstRenderDone === true &&
		component.renderDepDirty === true &&
		component.renderIsSync === true &&
		!component.beforeRender;
}
/**
 * The whole point of R1: a patch pass driven by a tracked `${this.state.x}` read
 * does only synchronous work — render() re-runs, updateTemplateSpots patches the
 * spots in place, deps re-subscribe — yet it used to be wrapped in
 * updateView→renderView→renderPass→.then, ~6 promises and 3+ microtask hops for
 * a body that never yields. The bus discards updateView's promise anyway
 * (state.js onFlush only arms `.catch`), so all of it was waste. Collapsing the
 * chain measures 3.79× on the scaffolding (benchmarks/patch-pass-chain.bench.js).
 *
 * Mirrors renderPass's patch-pass branch exactly, minus the structural lifecycle
 * (onRender/onRendered/awaitChildren) that a patch pass already skips. The
 * renderSeq bump + post-render check are kept even though nothing can yield
 * mid-pass: render() may synchronously re-enter via invalidateRender, and the
 * check is two reads.
 * @param {WebComponent} component - The component to patch.
 * @returns {PromiseLike|undefined} Undefined once the patch has landed; the
 * thenable render() unexpectedly returned when the pass had to be abandoned, for
 * renderView to settle through rescueAsyncRender.
 */
function patchPassSync(component) {
	component.templateBuilt = false;
	const sequence = ++component.renderSeq;
	const renderDeps = new Map();
	component.renderDepDirty = false;
	component.renderTracking = true;
	ensureRenderProxies(component);
	setCurrentTracking(renderDeps);
	/*
	 * App code, invoked BARE by the failure contract (the same bare-eval
	 * track() in state/binding.js has always used): a throwing render() body is
	 * an app bug and propagates raw. Safe without cleanup because every leak a
	 * throw leaves is inert or self-healing: whenRendered is NOT yet re-armed
	 * (the epoch arms below, after app code — nothing can wedge on it), the
	 * open tracking window records into a dead map nobody commits and every
	 * pass entry overwrites it, and the renderTracking flag resets at the next
	 * pass start (templateBuilt stays false, so the next state write always
	 * reaches updateView).
	 */
	const renderResult = component.render();
	setCurrentTracking(null);
	component.renderTracking = false;
	const renderedEpoch = component.lifecycle.armRendered();
	/*
	 * A render that returns a thenable despite renderIsSync (a body that turned
	 * conditionally async after its first pass) must not have its spots committed
	 * against a half-built template. Abandon the pass and RETURN the thenable:
	 * dropping it would leak an unhandled rejection, and an unsettled lifecycle
	 * promise wedges every ancestor awaiting this child. renderView hands it to
	 * rescueAsyncRender, which settles it through the normal failure boundary and
	 * then drives a real async pass — renderIsSync self-corrects there.
	 */
	if (isPromiseLike(renderResult)) {
		component.renderIsSync = false;
		component.renderDepDirty = true;
		component.finishRender(renderedEpoch);
		return renderResult;
	}
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedEpoch);
		return;
	}
	scanAndResolve(component.shadowRoot ?? component);
	const boundKeys = component.tplBoundKeys;
	if (boundKeys && boundKeys.size) {
		const localPaths = renderDeps.get(localRealm(component));
		if (localPaths) {
			boundKeys.forEach(localPaths.delete, localPaths);
		}
	}
	component.subscribeRenderDeps(renderDeps);
	component.templateBuilt = true;
	component.finishRender(renderedEpoch);
	if (defaultLogger.debugOn && component.config?.debugPatchOn !== false) {
		defaultLogger.debug('PATCH-PASS', component.state, `${component.constructor.name}<${component.localName}> (no re-render, sync)`);
	}
}
/**
 * Never-rejecting render boundary, sync fast path first. An eligible patch pass
 * runs start-to-finish with zero promises and returns undefined; every other
 * pass keeps the async chain. Callers must therefore treat the return as
 * undefined-or-Promise (`const p = x.renderView(); if (p) await p;`) — the same
 * idiom handleRendered/handleMount/awaitChildren already use in this file.
 *
 * The fast path carries NO try — the failure contract: a throwing render()
 * body is an app bug and unwinds RAW at its origin (matching the bus dispatch
 * and spot drain). patchPassSync sequences its mutations so a raw throw leaves
 * nothing wedged or corrupted — the epoch arms only AFTER the app call, so
 * whenRendered is never left pending (the silent-ancestor-hang hazard that
 * used to justify the catch). The dangling Perf mark on a throw is debug-tool
 * noise, not state. The async path is unchanged: rejection-based typed
 * returns (RenderFailure), no try there either.
 * @returns {Promise<void>|undefined} A Promise on the async path, else undefined.
 */
// @engram em:network/code/r1-shipped-sync-patch-pass-fast-path-3-79x-chain-collapse-it — why the chain collapsed, the caller contract, and why the browser cannot measure this
export function renderView() {
	if (canPatchSync(this)) {
		const perfMark = Perf.mark('renderView');
		const abandonedRender = patchPassSync(this);
		Perf.measure('renderView', perfMark);
		if (abandonedRender) {
			return rescueAsyncRender(this, abandonedRender);
		}
		return undefined;
	}
	return renderViewAsync(this);
}
/**
 * Salvage the rare pass that patchPassSync abandoned because a known-sync
 * render() returned a thenable. Settling it here keeps renderView's never-reject
 * contract (a dropped rejection is unhandled; a dropped promise can wedge an
 * awaiter), and the follow-up pass is what actually lands the patch — the
 * abandoned one committed nothing. render() runs twice on this path, which is
 * the correct trade for a body that changed shape mid-life.
 * @param {WebComponent} component - The component whose pass was abandoned.
 * @param {PromiseLike} abandonedRender - The thenable render() unexpectedly returned.
 */
async function rescueAsyncRender(component, abandonedRender) {
	const outcome = await abandonedRender.then(undefined, onRenderRejected);
	if (RenderFailure.is(outcome)) {
		recoverRenderPass(component, outcome.reason);
		return;
	}
	await renderViewAsync(component);
}
async function renderViewAsync(component) {
	const perfMark = Perf.mark('renderView');
	const outcome = await renderPass(component).then(undefined, onRenderRejected);
	if (RenderFailure.is(outcome)) {
		recoverRenderPass(component, outcome.reason);
	}
	Perf.measure('renderView', perfMark);
}
async function renderPass(component) {
	component.templateBuilt = false;
	const sequence = ++component.renderSeq;
	const renderedEpoch = component.lifecycle.armRendered();
	const renderDeps = new Map();
	const wasFirstRender = !component.firstRenderDone;
	/*
	 * A patch pass is a re-render triggered purely by a tracked renderDep
	 * (a bare `${this.state.x}` read). render() still re-runs so
	 * updateTemplateSpots can patch the changed spots in place — but the
	 * structural lifecycle (onRender, onRendered, awaitChildren) is skipped:
	 * those exist for first render and explicit invalidateRender only.
	 */
	const isPatchPass = !wasFirstRender && component.renderDepDirty === true;
	component.renderDepDirty = false;
	let renderSkipped = false;
	if (component.beforeRender) {
		const beforeResult = component.beforeRender();
		if (isPromiseLike(beforeResult)) {
			const awaitedBefore = await beforeResult.then(undefined, onRenderRejected);
			if (RenderFailure.is(awaitedBefore)) {
				return failRenderPass(component, renderedEpoch, awaitedBefore.reason);
			}
			if (awaitedBefore === false) {
				renderSkipped = true;
			}
		} else if (beforeResult === false) {
			renderSkipped = true;
		}
	}
	/*
	 * A skipped or superseded pass keeps the PREVIOUS render's dep
	 * subscriptions — a skip means "don't rebuild now", not "stop reacting".
	 * Tearing them down here would freeze the component permanently.
	 */
	if (sequence !== component.renderSeq || renderSkipped) {
		component.finishRender(renderedEpoch);
		return;
	}
	component.renderTracking = true;
	ensureRenderProxies(component);
	/*
	 * Dependency tracking spans only the synchronous body of render().
	 * currentTracking is module-global, so it is cleared before any await
	 * yields — otherwise an interleaving component's render absorbs, or is
	 * absorbed into, the wrong dep set. A synchronous throw from render()
	 * skips the inline clear and lands in recoverRenderPass, which clears it
	 * on the very next microtask — before any other tracking window can open.
	 * If render() is async, reads after its first await are untracked by
	 * design; do async prep in beforeRender instead.
	 */
	setCurrentTracking(renderDeps);
	const renderResult = component.render?.();
	setCurrentTracking(null);
	/*
	 * Teach canPatchSync from what render() actually returned, so later patch
	 * passes can skip this whole async chain. A component with no render() stays
	 * ineligible — patchPassSync calls render() unconditionally.
	 */
	component.renderIsSync = component.render ? !isPromiseLike(renderResult) : false;
	if (isPromiseLike(renderResult)) {
		if (defaultLogger.debugOn) {
			defaultLogger.error(`ASYNC-RENDER`, `${component.constructor.name}<${component.localName}> async render(): reads after the first await are untracked — move async work to beforeRender`);
		}
		const awaitedRender = await renderResult.then(undefined, onRenderRejected);
		if (RenderFailure.is(awaitedRender)) {
			if (sequence === component.renderSeq) {
				component.renderTracking = false;
			}
			return failRenderPass(component, renderedEpoch, awaitedRender.reason);
		}
	}
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedEpoch);
		return;
	}
	/*
	 * Fire-and-forget: lazy-load any undefined custom elements this render
	 * produced. Non-blocking so the parent's whenRendered doesn't wait —
	 * lazy children upgrade on their own once their module lands.
	 */
	scanAndResolve(component.shadowRoot ?? component);
	component.renderTracking = false;
	const boundKeys = component.tplBoundKeys;
	if (boundKeys && boundKeys.size) {
		/*
		 * Two-way-bound keys are LOCAL state paths; drop them from the
		 * local realm's path set so the renderDep and the $value spot
		 * don't double-subscribe. `Set.prototype.delete` is the iteratee,
		 * the local path set its thisArg — zero arrow allocation.
		 */
		const localPaths = renderDeps.get(localRealm(component));
		if (localPaths) {
			boundKeys.forEach(localPaths.delete, localPaths);
		}
	}
	component.subscribeRenderDeps(renderDeps);
	component.templateBuilt = true;
	if (isPatchPass) {
		/*
		 * Spots already patched in place by updateTemplateSpots; renderDeps
		 * re-subscribed above. No structural lifecycle.
		 */
		component.finishRender(renderedEpoch);
		if (defaultLogger.debugOn && component.config?.debugPatchOn !== false) {
			defaultLogger.debug('PATCH-PASS', component.state, `${component.constructor.name}<${component.localName}> (no re-render)`);
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
	if (component.onRender) {
		const onRenderResult = component.onRender();
		if (isPromiseLike(onRenderResult)) {
			const awaitedOnRender = await onRenderResult.then(undefined, onRenderRejected);
			if (RenderFailure.is(awaitedOnRender)) {
				return failRenderPass(component, renderedEpoch, awaitedOnRender.reason);
			}
		}
	}
	if (defaultLogger.debugOn) {
		defaultLogger.debug('onRender', `${component.constructor.name}<${component.localName}>`);
	}
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedEpoch);
		return;
	}
	const renderedResult = component.handleRendered(sequence, wasFirstRender, renderedEpoch);
	if (isPromiseLike(renderedResult)) {
		const awaitedRendered = await renderedResult.then(undefined, onRenderRejected);
		if (RenderFailure.is(awaitedRendered)) {
			return failRenderPass(component, renderedEpoch, awaitedRendered.reason);
		}
	}
	if (!wasFirstRender) {
		return;
	}
	component.firstRenderDone = true;
	const mountResult = component.handleMount();
	if (isPromiseLike(mountResult)) {
		const awaitedMount = await mountResult.then(undefined, onRenderRejected);
		if (RenderFailure.is(awaitedMount)) {
			return failRenderPass(component, renderedEpoch, awaitedMount.reason);
		}
	}
	const liveResult = component.handleLive();
	if (isPromiseLike(liveResult)) {
		const awaitedLive = await liveResult.then(undefined, onRenderRejected);
		if (RenderFailure.is(awaitedLive)) {
			return failRenderPass(component, renderedEpoch, awaitedLive.reason);
		}
	}
}
/**
 * Run the post-render lifecycle. Returns undefined when the body completes
 * synchronously (no children to await, no async onRendered hook); otherwise a
 * Promise. The async tail is split into `handleRenderedAsync` so the fast path
 * stays a non-Promise return — the caller checks before awaiting.
 * @param {number} sequence - The render sequence this pass belongs to.
 * @param {boolean} wasFirstRender - True on the component's first render.
 * @param {number} renderedEpoch - The whenRendered epoch captured at pass start.
 * @returns {Promise<void>|undefined} A Promise when async work is pending, else undefined.
 */
export function handleRendered(sequence, wasFirstRender, renderedEpoch) {
	const childPromise = awaitChildren(this, LIFECYCLE_PROMISE.RENDERED);
	if (childPromise) {
		return handleRenderedAsync(this, sequence, wasFirstRender, renderedEpoch, childPromise);
	}
	if (sequence !== this.renderSeq) {
		this.finishRender(renderedEpoch);
		return undefined;
	}
	if (this.onRendered) {
		const result = this.onRendered();
		if (isPromiseLike(result)) {
			return handleRenderedAsyncTail(this, sequence, wasFirstRender, renderedEpoch, result);
		}
	}
	if (wasFirstRender && this.phase === PHASE.CONNECTED) {
		this.phase = PHASE.RENDERED;
	}
	this.finishRender(renderedEpoch);
	return undefined;
}
async function handleRenderedAsync(component, sequence, wasFirstRender, renderedEpoch, childPromise) {
	await childPromise;
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedEpoch);
		return;
	}
	if (component.onRendered) {
		const result = component.onRendered();
		if (isPromiseLike(result)) {
			await result;
		}
	}
	if (wasFirstRender && component.phase === PHASE.CONNECTED) {
		component.phase = PHASE.RENDERED;
	}
	component.finishRender(renderedEpoch);
}
async function handleRenderedAsyncTail(component, sequence, wasFirstRender, renderedEpoch, onRenderedResult) {
	await onRenderedResult;
	if (sequence !== component.renderSeq) {
		component.finishRender(renderedEpoch);
		return;
	}
	if (wasFirstRender && component.phase === PHASE.CONNECTED) {
		component.phase = PHASE.RENDERED;
	}
	component.finishRender(renderedEpoch);
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
		this.lifecycle.fireMounted();
		return undefined;
	}
	if (this.onMount) {
		const result = this.onMount();
		if (isPromiseLike(result)) {
			return handleMountAsyncTail(this, result);
		}
	}
	if (this.phase === PHASE.RENDERED) {
		this.phase = PHASE.MOUNTED;
	}
	this.lifecycle.fireMounted();
	return undefined;
}
async function handleMountAsync(component, childPromise) {
	await childPromise;
	if (!component.isConnected) {
		component.lifecycle.fireMounted();
		return;
	}
	if (component.onMount) {
		const result = component.onMount();
		if (isPromiseLike(result)) {
			await result;
		}
	}
	if (component.phase === PHASE.RENDERED) {
		component.phase = PHASE.MOUNTED;
	}
	component.lifecycle.fireMounted();
}
async function handleMountAsyncTail(component, onMountResult) {
	await onMountResult;
	if (component.phase === PHASE.RENDERED) {
		component.phase = PHASE.MOUNTED;
	}
	component.lifecycle.fireMounted();
}
export async function handleLive() {
	await nextFrame();
	if (!this.isConnected) {
		this.lifecycle.fireLive();
		return;
	}
	this.classList.remove('mounting');
	/*
	 * awaitChildren is undefined for leaves and onLive is absent on most
	 * components — awaiting either unconditionally cost two microtasks per leaf
	 * first-mount, against this file's own stated guard idiom.
	 */
	const childPromise = awaitChildren(this, LIFECYCLE_PROMISE.LIVE);
	if (childPromise) {
		await childPromise;
		if (!this.isConnected) {
			this.lifecycle.fireLive();
			return;
		}
	}
	if (this.onLive) {
		const liveOutcome = this.onLive();
		if (isPromiseLike(liveOutcome)) {
			await liveOutcome;
		}
	}
	if (this.phase === PHASE.MOUNTED) {
		this.phase = PHASE.LIVE;
	}
	this.lifecycle.fireLive();
	this.installObserver();
}
