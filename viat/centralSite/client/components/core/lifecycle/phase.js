import { allChildren } from '../dom/children.js';
/**
 * Lifecycle phase constants. The single source of truth for every phase
 * string the framework reads or writes. Use `PHASE.X` everywhere — never a
 * bare string literal. Changing a phase's underlying string here propagates
 * to every comparison and assignment in the codebase with zero churn.
 *
 * Ordering: CREATED → CONNECTED → RENDERED → MOUNTED → LIVE (the forward
 * lifecycle progression measured by `atPhase`), plus DISCONNECTED and
 * DESTROYED as terminal phases that don't participate in the ordinal
 * comparison.
 */
export const PHASE = Object.freeze({
	CREATED: 'created',
	CONNECTED: 'connected',
	RENDERED: 'rendered',
	MOUNTED: 'mounted',
	LIVE: 'live',
	DISCONNECTED: 'disconnected',
	DESTROYED: 'destroyed',
});
const PHASE_INDEX = {
	[PHASE.CREATED]: 0,
	[PHASE.CONNECTED]: 1,
	[PHASE.RENDERED]: 2,
	[PHASE.MOUNTED]: 3,
	[PHASE.LIVE]: 4,
};
export function atPhase(target) {
	const targetIndex = PHASE_INDEX[target];
	const currentIndex = PHASE_INDEX[this.phase];
	if (targetIndex === undefined || currentIndex === undefined) {
		return false;
	}
	return currentIndex >= targetIndex;
}
export const phaseGetters = {
	isMounted: {
		configurable: true,
		get() {
			return this.atPhase(PHASE.MOUNTED);
		},
	},
	isLive: {
		configurable: true,
		get() {
			return this.atPhase(PHASE.LIVE);
		},
	},
	isRendered: {
		configurable: true,
		get() {
			return this.atPhase(PHASE.RENDERED);
		},
	},
	isDisconnected: {
		configurable: true,
		get() {
			return this.phase === PHASE.DISCONNECTED;
		},
	},
	isDestroyed: {
		configurable: true,
		get() {
			return this.phase === PHASE.DESTROYED;
		},
	},
	whenTreeVisible: {
		configurable: true,
		get() {
			if (this.lifecycle.treeVisiblePromise) {
				return this.lifecycle.treeVisiblePromise;
			}
			const children = allChildren(this);
			const childPromises = children.map((child) => {
				return child.whenTreeVisible;
			});
			this.lifecycle.treeVisiblePromise = Promise.all([this.lifecycle.whenVisible, ...childPromises]);
			return this.lifecycle.treeVisiblePromise;
		},
	},
};
