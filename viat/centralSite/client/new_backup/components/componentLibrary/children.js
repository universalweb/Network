const childrenMap = new WeakMap();
const localFin = new FinalizationRegistry(({ set, ref, tag, host }) => {
	set.delete(ref);
	const children = childrenMap.get(host);
	if (children && !set.size) children.delete(tag);
});
export function registerChild(host, element) {
	let children = childrenMap.get(host);
	if (!children) {
		children = new Map();
		childrenMap.set(host, children);
	}
	const tag = element.tagName.toLowerCase();
	let set = children.get(tag);
	if (!set) {
		set = new Set();
		children.set(tag, set);
	}
	const ref = new WeakRef(element);
	set.add(ref);
	localFin.register(element, { set, ref, tag, host }, ref);
	return () => {
		localFin.unregister(ref);
		set.delete(ref);
		if (!set.size) children.delete(tag);
	};
}
export function liveChildren(host, tag) {
	const set = childrenMap.get(host)?.get(tag);
	if (!set) return [];
	const out = [];
	for (const ref of set) {
		const el = ref.deref();
		if (el) out.push(el);
		else set.delete(ref);
	}
	if (!set.size) childrenMap.get(host)?.delete(tag);
	return out;
}
