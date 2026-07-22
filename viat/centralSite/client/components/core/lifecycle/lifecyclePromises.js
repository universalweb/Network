/*
 * Lazy lifecycle promise slots (KNOWN-7c). The old shape minted six
 * Promise.withResolvers into a plain `lifecycle = {}` bag per CONSTRUCT — and
 * re-minted whenRendered on every render pass — paid even when nobody ever
 * read a `whenX`. Each key is now a tri-state slot on ONE monomorphic class:
 *
 *   PENDING — the transition has not completed; no promise exists.
 *   ARMED   — pending AND someone read the getter: a live deferred exists.
 *   SETTLED — the transition completed; reads return the shared resolved
 *             promise.
 *
 * A read can never receive an unsettleable promise: reading a PENDING slot
 * arms it, and every fire path (normal completion, stranded-disconnect
 * resolve, render-failure recovery) settles ARMED slots — the always-settle
 * contract that keeps ancestors' awaitChildren from wedging. Reads mid-pass
 * arm and settle at that pass's end; reads after a settle get the shared
 * resolved promise; slots nobody reads never allocate at all.
 *
 * whenRendered additionally carries a pass EPOCH. Overlapping render passes
 * share one pending slot (any pass completion settles it — the old
 * shared-resolver semantics). The guard the epoch preserves: a SUPERSEDED
 * pass finishing after the slot settled and a newer pass re-armed it must
 * not settle the newer pass's slot. The epoch captured at pass start (a
 * number) replaces the old captured-resolver identity check with zero
 * allocation.
 *
 * The getters and fire methods are written longhand per key on purpose — no
 * dynamic `${key}State` field names — so every access is a monomorphic named
 * slot on one hidden class.
 */
// @engram em:network/code/tk-42-shipped-tri-state-lazy-lifecycle-epoch-guard-list-bulk — the tri-state design, the epoch guard, and the always-settle proof obligations
const RESOLVED_PROMISE = Promise.resolve();
const SLOT_PENDING = 0;
const SLOT_ARMED = 1;
const SLOT_SETTLED = 2;
export class Lifecycle {
	whenConnectedState = SLOT_PENDING;
	whenConnectedPromise = null;
	whenConnectedResolve = null;
	whenRenderedState = SLOT_PENDING;
	whenRenderedPromise = null;
	whenRenderedResolve = null;
	whenMountedState = SLOT_PENDING;
	whenMountedPromise = null;
	whenMountedResolve = null;
	whenLiveState = SLOT_PENDING;
	whenLivePromise = null;
	whenLiveResolve = null;
	whenVisibleState = SLOT_PENDING;
	whenVisiblePromise = null;
	whenVisibleResolve = null;
	whenDestroyedState = SLOT_PENDING;
	whenDestroyedPromise = null;
	whenDestroyedResolve = null;
	renderedEpoch = 1;
	treeVisiblePromise = null;
	get whenConnected() {
		if (this.whenConnectedState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenConnectedState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenConnectedPromise = deferred.promise;
			this.whenConnectedResolve = deferred.resolve;
			this.whenConnectedState = SLOT_ARMED;
		}
		return this.whenConnectedPromise;
	}
	get whenRendered() {
		if (this.whenRenderedState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenRenderedState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenRenderedPromise = deferred.promise;
			this.whenRenderedResolve = deferred.resolve;
			this.whenRenderedState = SLOT_ARMED;
		}
		return this.whenRenderedPromise;
	}
	get whenMounted() {
		if (this.whenMountedState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenMountedState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenMountedPromise = deferred.promise;
			this.whenMountedResolve = deferred.resolve;
			this.whenMountedState = SLOT_ARMED;
		}
		return this.whenMountedPromise;
	}
	get whenLive() {
		if (this.whenLiveState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenLiveState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenLivePromise = deferred.promise;
			this.whenLiveResolve = deferred.resolve;
			this.whenLiveState = SLOT_ARMED;
		}
		return this.whenLivePromise;
	}
	get whenVisible() {
		if (this.whenVisibleState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenVisibleState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenVisiblePromise = deferred.promise;
			this.whenVisibleResolve = deferred.resolve;
			this.whenVisibleState = SLOT_ARMED;
		}
		return this.whenVisiblePromise;
	}
	get whenDestroyed() {
		if (this.whenDestroyedState === SLOT_SETTLED) {
			return RESOLVED_PROMISE;
		}
		if (this.whenDestroyedState === SLOT_PENDING) {
			const deferred = Promise.withResolvers();
			this.whenDestroyedPromise = deferred.promise;
			this.whenDestroyedResolve = deferred.resolve;
			this.whenDestroyedState = SLOT_ARMED;
		}
		return this.whenDestroyedPromise;
	}
	fireConnected() {
		if (this.whenConnectedState === SLOT_ARMED) {
			this.whenConnectedResolve();
			this.whenConnectedResolve = null;
			this.whenConnectedPromise = null;
		}
		this.whenConnectedState = SLOT_SETTLED;
	}
	/**
	 * Epoch-guarded rendered settle — the render passes' entry point. A stale
	 * epoch (the slot settled and re-armed since that pass started) no-ops,
	 * exactly like the old already-fired captured resolver.
	 * @param {number} renderedEpoch - The epoch captured at that pass's start.
	 */
	fireRendered(renderedEpoch) {
		if (renderedEpoch !== this.renderedEpoch) {
			return;
		}
		this.settleRendered();
	}
	settleRendered() {
		if (this.whenRenderedState === SLOT_ARMED) {
			this.whenRenderedResolve();
			this.whenRenderedResolve = null;
			this.whenRenderedPromise = null;
		}
		this.whenRenderedState = SLOT_SETTLED;
	}
	fireMounted() {
		if (this.whenMountedState === SLOT_ARMED) {
			this.whenMountedResolve();
			this.whenMountedResolve = null;
			this.whenMountedPromise = null;
		}
		this.whenMountedState = SLOT_SETTLED;
	}
	fireLive() {
		if (this.whenLiveState === SLOT_ARMED) {
			this.whenLiveResolve();
			this.whenLiveResolve = null;
			this.whenLivePromise = null;
		}
		this.whenLiveState = SLOT_SETTLED;
	}
	fireVisible() {
		if (this.whenVisibleState === SLOT_ARMED) {
			this.whenVisibleResolve();
			this.whenVisibleResolve = null;
			this.whenVisiblePromise = null;
		}
		this.whenVisibleState = SLOT_SETTLED;
	}
	fireDestroyed() {
		if (this.whenDestroyedState === SLOT_ARMED) {
			this.whenDestroyedResolve();
			this.whenDestroyedResolve = null;
			this.whenDestroyedPromise = null;
		}
		this.whenDestroyedState = SLOT_SETTLED;
	}
	/**
	 * Open the rendered slot for a new pass. A SETTLED slot re-opens under a
	 * fresh epoch (staling any not-yet-finished older pass); a still-pending
	 * slot is kept as-is — overlapping passes share it, first completion wins.
	 * @returns {number} The epoch the starting pass must capture.
	 */
	armRendered() {
		if (this.whenRenderedState === SLOT_SETTLED) {
			this.whenRenderedState = SLOT_PENDING;
			this.renderedEpoch += 1;
		}
		return this.renderedEpoch;
	}
	armConnected() {
		if (this.whenConnectedState === SLOT_SETTLED) {
			this.whenConnectedState = SLOT_PENDING;
		}
	}
	armMounted() {
		if (this.whenMountedState === SLOT_SETTLED) {
			this.whenMountedState = SLOT_PENDING;
		}
	}
	armLive() {
		if (this.whenLiveState === SLOT_SETTLED) {
			this.whenLiveState = SLOT_PENDING;
		}
	}
	armVisible() {
		if (this.whenVisibleState === SLOT_SETTLED) {
			this.whenVisibleState = SLOT_PENDING;
		}
	}
	/**
	 * Re-arm the forward connect-cycle slots for a fresh connect (reconnect /
	 * DOM move). whenDestroyed is one-shot and deliberately not here.
	 */
	armConnectCycle() {
		this.armConnected();
		this.armRendered();
		this.armMounted();
		this.armLive();
		this.armVisible();
		this.treeVisiblePromise = null;
	}
	/**
	 * Stranded-resolve every forward slot — the element left the DOM before its
	 * cycle completed, and awaiters must settle rather than hang.
	 */
	fireConnectCycle() {
		this.fireConnected();
		this.settleRendered();
		this.fireMounted();
		this.fireLive();
		this.fireVisible();
		this.treeVisiblePromise = null;
	}
}
