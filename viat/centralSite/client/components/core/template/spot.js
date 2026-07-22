/*
 * Shared spot primitives — the leaf module both template.js (the runtime
 * core) and template/list.js (the keyed-list machinery) build on. The `Spot`
 * base class and the node-cleanup contract live here because `class X extends
 * Spot` is an EVAL-time read: inside the deliberate template ↔ list import
 * cycle the extending module can evaluate before the other's body runs, so
 * the base class must come from a cycle-free leaf.
 */
import { markSpotDirty } from '../lifecycle/scheduler.js';
import {
	clearRealmUnsubs,
	disposeItem,
	eachArray,
	isFunction,
} from '../utilities.js';
import { SPOT_KIND } from './constants.js';
export const TEMPLATE_CLEANUP = Symbol('templateCleanup');
export function cleanupTemplateNode(node) {
	if (!node) {
		return;
	}
	const cleanup = node[TEMPLATE_CLEANUP];
	if (!isFunction(cleanup)) {
		return;
	}
	node[TEMPLATE_CLEANUP] = null;
	cleanup(node);
}
/**
 * Remove every node strictly BETWEEN an anchored spot's two comment markers,
 * leaving the comments themselves in place. The anchored counterpart to a
 * wrapper's `element.textContent = ''` / `element.innerHTML =` wipe — it touches only the
 * spot's own range, never the static siblings that share the parent element.
 * `cleanupTemplateNode` runs per removed node (idempotent) so nested template
 * instances (list rows, html fragments) release their spots/subscriptions.
 */
export function clearRange(startComment, endComment) {
	let node = startComment.nextSibling;
	while (node && node !== endComment) {
		const next = node.nextSibling;
		cleanupTemplateNode(node);
		node.remove();
		node = next;
	}
}
/**
 * Abstract base for every template spot. Spots are the per-DOM-node patchers
 * built from a recipe plan. The class hierarchy replaces the old plain-
 * object spot shapes — `this`-using prototype methods eliminate the per-spot
 * `.bind(null, spot)` allocations that used to back `updateHandler` /
 * `refreshTask`. Subscribed via the bus's `target` arg → bus dispatches
 * `Spot.prototype.handle.call(spot, …)` with zero per-spot closure.
 */
export class Spot {
	constructor() {
		/*
		 * Lazy — only two-way spots ever hold direct subscriptions, so the
		 * common spot skips the array allocation. Pushers use `??=`.
		 */
		this.unsubs = null;
		this.depMap = null;
		this.pendingPaths = null;
	}
	/** Bus handler. Marks the spot dirty for the single per-microtask drain
	 *  (drainSpots at the tail of masterFlush) — Set membership is the dedup, so
	 *  N deps firing for one spot in a flush still drain it once. List spots
	 *  accumulate changed paths so the drain can decide between per-item
	 *  assignState (partial) and full re-diff.
	 *
	 *  The signature must match the bus's 2-arg dispatch: fireSubscription calls
	 *  `handler.call(target, value, changedPath)`. List spots read `changedPath`
	 *  from the second parameter — a 3-arg shape would park it in the wrong slot
	 *  and feed `undefined`, collapsing every in-place deep mutation onto the
	 *  same-ref-skipping full re-diff and never reaching the DOM. */
	handle(_value, changedPath) {
		if (this.kind === SPOT_KIND.LIST) {
			if (!this.pendingPaths) {
				this.pendingPaths = [];
			}
			this.pendingPaths.push(changedPath);
		}
		markSpotDirty(this);
	}
	/** Drain hook — runs once per microtask in drainSpots. Default re-evaluates
	 *  via refresh(); BindingSpot overrides to apply its captured value. */
	drain() {
		return this.refresh();
	}
	/** Virtual. Subclasses with reactive deps override. */
	refresh() {
		return undefined;
	}
	unsubscribe() {
		if (this.depMap) {
			clearRealmUnsubs(this.depMap);
			this.depMap = null;
		}
		if (this.unsubs && this.unsubs.length) {
			eachArray(this.unsubs, disposeItem);
			this.unsubs = null;
		}
		this.pendingPaths = null;
	}
}
