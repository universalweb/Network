import { isTypeUndefined } from '../utilities.js';
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
		this.lifecycle.fireVisible();
		this.onVisible?.();
	}
}
/*
 * The shared observer's dispatch — a first-class module function (the observer
 * invokes it with no useful `this`); each entry routes to its component via
 * the element registry.
 */
function dispatchIntersectionEntries(entries) {
	const entriesLength = entries.length;
	for (let index = 0; index < entriesLength; index++) {
		const entry = entries[index];
		const component = componentRegistry.get(entry.target);
		if (component) {
			handleObserverCallback.call(component, entry);
		}
	}
}
function ensureSharedObserver() {
	if (sharedObserver) {
		return sharedObserver;
	}
	if (isTypeUndefined(typeof IntersectionObserver)) {
		return null;
	}
	sharedObserver = new IntersectionObserver(dispatchIntersectionEntries, {
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
	// intersectObserved ⇒ sharedObserver was installed (non-null by construction).
	const observer = sharedObserver;
	componentRegistry.delete(this);
	this.intersectObserved = false;
	observer.unobserve(this);
}
