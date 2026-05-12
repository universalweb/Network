import { eachObject, hasValue, isString } from '../utilities.js';
import { liveChildren } from './children.js';
export function getComponent(tag) {
	return liveChildren(this, tag?.toLowerCase())[0] ?? null;
}
export function getComponents(tag) {
	return liveChildren(this, tag?.toLowerCase());
}
export function getComponentsArray(tag) {
	const components = this.getComponents(tag);
	if (!components) {
		return [];
	}
	return [...components];
}
export function findComponent(selector, predicate) {
	return this.getComponentsArray(selector).find(predicate) ?? null;
}
export function getComponentRoot() {
	return this.shadowRoot;
}
export function findElement(target) {
	return isString(target) ? document.querySelector(target) : target;
}
export function appendTo(target) {
	return this.findElement(target)?.appendChild(this);
}
export function prependTo(target) {
	return this.findElement(target)?.prepend(this);
}
export function ifAssign(target) {
	eachObject(target, (key, value) => {
		if (hasValue(this.state[key])) {
			this.state[key] = value;
		}
	});
	return target;
}
