import { fireResolver, isTypeUndefined } from '../utilities.js';
import { LIFECYCLE_PROMISE } from './lifecycle.js';
const componentRegistry = new WeakMap();
let sharedObserver = null;
function checkManualVisibility(element) {
	const styles = getComputedStyle(element);
	if (styles.visibility === 'hidden' || styles.display === 'none') {
		return false;
	}
	return Number(styles.opacity) > 0;
}
export function handleObserverCallback(entry) {
	this.isIntersecting = entry.isIntersecting;
	if (entry.isIntersecting && !this.isIntersected) {
		this.isIntersected = true;
	}
	this.onIntersect?.(entry.isIntersecting);
	const visibleNow = entry.isIntersecting && checkManualVisibility(this);
	this.isVisible = visibleNow;
	if (visibleNow && !this.visibleFired) {
		this.visibleFired = true;
		fireResolver(this.lifecycle, LIFECYCLE_PROMISE.VISIBLE);
		this.onVisible?.();
	}
}
function ensureSharedObserver() {
	if (sharedObserver) {
		return sharedObserver;
	}
	if (isTypeUndefined(typeof IntersectionObserver)) {
		return null;
	}
	sharedObserver = new IntersectionObserver((entries) => {
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			const component = componentRegistry.get(entry.target);
			if (component) {
				handleObserverCallback.call(component, entry);
			}
		}
	}, {
		threshold: 0,
	});
	return sharedObserver;
}
export function installObserver() {
	if (this.intersectObserved) {
		return;
	}
	if (!this.onIntersect && !this.onVisible) {
		return;
	}
	const observer = ensureSharedObserver();
	if (!observer) {
		return;
	}
	componentRegistry.set(this, this);
	this.intersectObserved = true;
	observer.observe(this);
}
export function uninstallObserver() {
	if (!this.intersectObserved) {
		return;
	}
	const observer = sharedObserver;
	componentRegistry.delete(this);
	this.intersectObserved = false;
	observer?.unobserve(this);
}
