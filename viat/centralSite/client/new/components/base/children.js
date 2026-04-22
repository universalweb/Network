import { noValue } from './utilities.js';
const childrenMap = new WeakMap();
function getHostChildren(host) {
	let children = childrenMap.get(host);
	if (!children) {
		children = new Map();
		childrenMap.set(host, children);
	}
	return children;
}
function getTagChildren(host, tag) {
	const children = getHostChildren(host);
	let list = children.get(tag);
	if (!list) {
		list = [];
		children.set(tag, list);
	}
	return list;
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
	for (const list of children.values()) {
		out.push(...list);
	}
	return out;
}
export function liveChildren(host, tag) {
	if (noValue(tag)) {
		return getHostChildren(host);
	}
	return getTagChildren(host, tag);
}
