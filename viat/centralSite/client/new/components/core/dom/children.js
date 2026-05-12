import { getOrInit, noValue } from '../utilities.js';
const childrenMap = new WeakMap();
function getHostChildren(host) {
	return getOrInit(childrenMap, host, () => {
		return new Map();
	});
}
function getTagChildren(host, tag) {
	return getOrInit(getHostChildren(host), tag, () => {
		return [];
	});
}
export function registerChild(host, element) {
	const tag = element.tagName.toLowerCase();
	const list = getTagChildren(host, tag);
	if (!list.includes(element)) {
		list.push(element);
	}
	return () => {
		const itemIndex = list.indexOf(element);
		if (itemIndex !== -1) {
			list.splice(itemIndex, 1);
		}
	};
}
export function allChildren(host) {
	const children = childrenMap.get(host);
	if (!children) {
		return [];
	}
	const out = [];
	children.forEach((list) => {
		out.push(...list);
	});
	return out;
}
export function liveChildren(host, tag) {
	if (noValue(tag)) {
		return getHostChildren(host);
	}
	return getTagChildren(host, tag);
}
