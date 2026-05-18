import { isFunction, isPlainObject, isString } from '../utilities.js';
const components = new Map();
const componentIds = new WeakMap();
const parents = new WeakMap();
const childrenSets = new WeakMap();
const roots = new Set();
const tagTools = new Map();
const instanceTools = new WeakMap();
const globalTools = new Map();
const subscribers = new Set();
let counter = 0;
function makeId(component) {
	if (isString(component.id) && component.id.length) {
		return component.id;
	}
	counter += 1;
	return `${component.tagName.toLowerCase()}.${counter}`;
}
function notify(event) {
	subscribers.forEach((fn) => {
		try {
			fn(event);
		} catch (error) {
			queueMicrotask(() => {
				throw error;
			});
		}
	});
}
function recordParent(component, parentComponent) {
	if (parentComponent) {
		parents.set(component, parentComponent);
		let kids = childrenSets.get(parentComponent);
		if (!kids) {
			kids = new Set();
			childrenSets.set(parentComponent, kids);
		}
		kids.add(component);
		roots.delete(component);
	} else {
		parents.set(component, null);
		roots.add(component);
	}
}
function clearParent(component) {
	const parentComponent = parents.get(component);
	if (parentComponent) {
		const kids = childrenSets.get(parentComponent);
		kids?.delete(component);
	}
	parents.delete(component);
	roots.delete(component);
	childrenSets.delete(component);
}
export function registerComponent(component, parentComponent = null) {
	let id = componentIds.get(component);
	if (!id) {
		id = makeId(component);
		while (components.has(id) && components.get(id) !== component) {
			counter += 1;
			id = `${component.tagName.toLowerCase()}.${counter}`;
		}
		componentIds.set(component, id);
	}
	components.set(id, component);
	recordParent(component, parentComponent);
	notify({
		type: 'componentAdded',
		id,
		tag: component.tagName.toLowerCase(),
	});
	return id;
}
export function unregisterComponent(component) {
	const id = componentIds.get(component);
	if (!id) {
		return;
	}
	if (components.get(id) === component) {
		components.delete(id);
	}
	componentIds.delete(component);
	instanceTools.delete(component);
	clearParent(component);
	notify({
		type: 'componentRemoved',
		id,
	});
}
export function getComponentId(component) {
	return componentIds.get(component) ?? null;
}
export function getComponentById(id) {
	return components.get(id) ?? null;
}
export function getParent(component) {
	return parents.get(component) ?? null;
}
export function getChildren(component) {
	return childrenSets.get(component) ?? null;
}
export function getRoots() {
	return Array.from(roots);
}
export function eachComponent(fn) {
	components.forEach((component, id) => {
		fn(component, id);
	});
}
export function listComponents() {
	const out = [];
	components.forEach((component, id) => {
		out.push({
			id,
			component,
		});
	});
	return out;
}
export function defineGlobalTool(name, def) {
	globalTools.set(name, def);
	return () => {
		if (globalTools.get(name) === def) {
			globalTools.delete(name);
		}
	};
}
export function defineTagTool(tag, name, def) {
	const key = String(tag).toLowerCase();
	let map = tagTools.get(key);
	if (!map) {
		map = new Map();
		tagTools.set(key, map);
	}
	map.set(name, def);
	return () => {
		const current = tagTools.get(key);
		if (current?.get(name) === def) {
			current.delete(name);
		}
	};
}
export function defineInstanceTool(component, name, def) {
	let map = instanceTools.get(component);
	if (!map) {
		map = new Map();
		instanceTools.set(component, map);
	}
	map.set(name, def);
	return () => {
		const current = instanceTools.get(component);
		if (current?.get(name) === def) {
			current.delete(name);
		}
	};
}
export function getTools(component) {
	const merged = new Map();
	globalTools.forEach((def, name) => {
		merged.set(name, def);
	});
	const staticTools = component?.constructor?.aiTools;
	if (isPlainObject(staticTools)) {
		Object.keys(staticTools).forEach((name) => {
			merged.set(name, staticTools[name]);
		});
	}
	const tag = component?.tagName?.toLowerCase();
	if (tag && tagTools.has(tag)) {
		tagTools.get(tag).forEach((def, name) => {
			merged.set(name, def);
		});
	}
	const localMap = instanceTools.get(component);
	if (localMap) {
		localMap.forEach((def, name) => {
			merged.set(name, def);
		});
	}
	return merged;
}
export function subscribe(handler) {
	if (!isFunction(handler)) {
		return () => {};
	}
	subscribers.add(handler);
	return () => {
		subscribers.delete(handler);
	};
}
export function getStats() {
	return {
		components: components.size,
		roots: roots.size,
		globalTools: globalTools.size,
		tagTools: tagTools.size,
		subscribers: subscribers.size,
	};
}
export function listAllTools() {
	const seen = new Set();
	const out = [];
	function push(name, def) {
		if (seen.has(name)) {
			return;
		}
		seen.add(name);
		out.push({
			name,
			description: def.description ?? '',
			inputSchema: def.inputSchema ?? { type: 'object' },
			mutating: def.mutating === true,
		});
	}
	globalTools.forEach((def, name) => push(name, def));
	components.forEach((component) => {
		getTools(component).forEach((def, name) => push(name, def));
	});
	return out;
}
