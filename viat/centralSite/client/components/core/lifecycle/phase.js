import { allChildren } from '../dom/children.js';
const PHASE_INDEX = {
	created: 0,
	connected: 1,
	rendered: 2,
	mounted: 3,
	live: 4,
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
			return this.atPhase('mounted');
		},
	},
	isLive: {
		configurable: true,
		get() {
			return this.atPhase('live');
		},
	},
	isRendered: {
		configurable: true,
		get() {
			return this.atPhase('rendered');
		},
	},
	isDisconnected: {
		configurable: true,
		get() {
			return this.phase === 'disconnected';
		},
	},
	isDestroyed: {
		configurable: true,
		get() {
			return this.phase === 'destroyed';
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
