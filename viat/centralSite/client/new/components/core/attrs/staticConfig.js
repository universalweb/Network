import { assign, getProto, hasOwn } from '../utilities.js';
export function collectClassChain(ComponentClass) {
	const chain = [];
	let current = ComponentClass;
	while (current && current !== HTMLElement) {
		chain.push(current);
		current = getProto(current);
	}
	chain.reverse();
	return chain;
}
function computeMerged(ComponentClass, fieldName) {
	const parent = getProto(ComponentClass);
	if (parent !== null && getProto(parent) === HTMLElement) {
		return hasOwn(ComponentClass, fieldName) ? {
			...ComponentClass[fieldName],
		} : {};
	}
	const chain = collectClassChain(ComponentClass);
	const merged = {};
	for (let index = 0; index < chain.length; index++) {
		const classRef = chain[index];
		if (hasOwn(classRef, fieldName)) {
			assign(merged, classRef[fieldName]);
		}
	}
	return merged;
}
function ensureMerged(ComponentClass, fieldName, cacheName) {
	if (hasOwn(ComponentClass, cacheName)) {
		return ComponentClass[cacheName];
	}
	const merged = computeMerged(ComponentClass, fieldName);
	Object.defineProperty(ComponentClass, cacheName, {
		value: merged,
		configurable: true,
		writable: true,
	});
	return merged;
}
export function ensureMergedState(ComponentClass) {
	return ensureMerged(ComponentClass, 'state', 'mergedState');
}
export function ensureMergedAttrs(ComponentClass) {
	return ensureMerged(ComponentClass, 'attrs', 'mergedAttrs');
}
export function ensureMergedConfig(ComponentClass) {
	return ensureMerged(ComponentClass, 'config', 'mergedConfig');
}
