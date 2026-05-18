import {
	assign,
	deepMerge,
	getProto,
	hasOwn,
} from '../utilities.js';
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
	const parentClass = getProto(ComponentClass);
	if (parentClass !== null && getProto(parentClass) === HTMLElement) {
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
// Flag-aware static state merger. Walks the class chain root → leaf and folds
// each ancestor's `static state` into an accumulator. Behavior switches on
// class-level flags:
//   - `static mergeState = false` → no chain merge; uses only the current
//     class's own `static state` (parents ignored entirely)
//   - `static mergeObjects = true` → container values (plain objects, arrays,
//     Sets, Maps) deep-merge through the chain; otherwise newer class's value
//     replaces the accumulator at that key
// Caches the result on the class under `mergedState`. Flags are read from the
// class via static prototype inheritance, so subclass overrides are honored.
function computeMergedState(ComponentClass) {
	const mergeStateOff = ComponentClass.mergeState === false;
	const mergeObjects = ComponentClass.mergeObjects === true;
	if (mergeStateOff) {
		return hasOwn(ComponentClass, 'state') ? {
			...ComponentClass.state,
		} : {};
	}
	const chain = collectClassChain(ComponentClass);
	const merged = {};
	for (let index = 0; index < chain.length; index++) {
		const classRef = chain[index];
		if (!hasOwn(classRef, 'state')) {
			continue;
		}
		const source = classRef.state;
		const keys = Object.keys(source);
		for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
			const key = keys[keyIndex];
			const incoming = source[key];
			if (!mergeObjects) {
				merged[key] = incoming;
				continue;
			}
			merged[key] = deepMerge(merged[key], incoming);
		}
	}
	return merged;
}
export function ensureMergedState(ComponentClass) {
	if (hasOwn(ComponentClass, 'mergedState')) {
		return ComponentClass.mergedState;
	}
	const merged = computeMergedState(ComponentClass);
	Object.defineProperty(ComponentClass, 'mergedState', {
		value: merged,
		configurable: true,
		writable: true,
	});
	return merged;
}
export function ensureMergedAttrs(ComponentClass) {
	return ensureMerged(ComponentClass, 'attrs', 'mergedAttrs');
}
export function ensureMergedConfig(ComponentClass) {
	return ensureMerged(ComponentClass, 'config', 'mergedConfig');
}
