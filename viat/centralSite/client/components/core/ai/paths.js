import {
	getChildren,
	getParent,
	getRoots,
	subscribe,
} from './registry.js';
import { isString } from '../utilities.js';
const SEPARATOR = '.';
let indexCache = null;
export function invalidatePathIndex() {
	indexCache = null;
}
subscribe(invalidatePathIndex);
function dashToCamel(match, ch) {
	return ch.toUpperCase();
}
function tagSlug(component) {
	const tag = component.tagName.toLowerCase();
	const dashIndex = tag.indexOf('-');
	const base = dashIndex >= 0 ? tag.slice(dashIndex + 1) : tag;
	return base.replace(/-([a-z0-9])/g, dashToCamel);
}
function nameSegment(component, takenNames) {
	const explicit = component.constructor.aiName;
	if (isString(explicit) && explicit.length) {
		return explicit;
	}
	const componentId = component.id;
	if (isString(componentId) && componentId.length && !componentId.includes(SEPARATOR)) {
		return componentId;
	}
	const base = tagSlug(component);
	let candidate = base;
	let n = 2;
	while (takenNames.has(candidate)) {
		candidate = `${base}${n}`;
		n += 1;
	}
	return candidate;
}
/**
 * Walks the registry tree once and populates three correlated lookups in
 * lockstep. Class form so `visit` is a prototype method shared across the
 * recursion — zero per-call closure allocation, the three maps live on the
 * instance, and the shape is monomorphic so the JIT can inline the dispatch.
 */
class PathIndexBuilder {
	componentByPath = new Map();
	pathByComponent = new WeakMap();
	nameByComponent = new WeakMap();
	static create() {
		return new PathIndexBuilder();
	}
	visit(component, parentPath, taken) {
		const segment = nameSegment(component, taken);
		taken.add(segment);
		this.nameByComponent.set(component, segment);
		const fullPath = parentPath ? `${parentPath}${SEPARATOR}${segment}` : segment;
		this.componentByPath.set(fullPath, component);
		this.pathByComponent.set(component, fullPath);
		const kids = getChildren(component);
		if (!kids?.size) {
			return;
		}
		const childArray = [...kids];
		const childTaken = new Set();
		for (let i = 0; i < childArray.length; i += 1) {
			this.visit(childArray[i], fullPath, childTaken);
		}
	}
	build() {
		const rootList = getRoots();
		const rootTaken = new Set();
		for (let i = 0; i < rootList.length; i += 1) {
			this.visit(rootList[i], '', rootTaken);
		}
		return this;
	}
}
function getIndex() {
	if (!indexCache) {
		indexCache = PathIndexBuilder.create().build();
	}
	return indexCache;
}
export function resolvePath(path) {
	if (!isString(path) || !path.length) {
		return null;
	}
	return getIndex().componentByPath.get(path) ?? null;
}
export function getPathForComponent(component) {
	if (!component) {
		return null;
	}
	return getIndex().pathByComponent.get(component) ?? null;
}
export function getNameForComponent(component) {
	if (!component) {
		return null;
	}
	return getIndex().nameByComponent.get(component) ?? null;
}
export function getDirectChildren(component) {
	const kids = getChildren(component);
	if (!kids?.size) {
		return [];
	}
	return Array.from(kids);
}
export function getRootComponents() {
	return getRoots();
}
export function listPaths() {
	return Array.from(getIndex().componentByPath.keys());
}
function lightDescriptor(component, opts) {
	const node = {
		tag: component.tagName.toLowerCase(),
	};
	const role = component.constructor.aiRole ?? component.getAttribute('role');
	if (role) {
		node.role = role;
	}
	const label = component.getAttribute('aria-label') ?? component.constructor.aiLabel ?? null;
	if (label) {
		node.label = label;
	}
	if (opts?.withPhase) {
		node.phase = component.phase ?? null;
	}
	if (opts?.withVisibility) {
		node.visible = component.isVisible === true;
		node.intersecting = component.isIntersecting === true;
	}
	return node;
}
function buildOverviewNode(component, depth, opts) {
	const node = lightDescriptor(component, opts);
	if (depth <= 0) {
		return node;
	}
	const kids = getChildren(component);
	if (!kids?.size) {
		return node;
	}
	const out = {};
	const nameByComponent = getIndex().nameByComponent;
	kids.forEach((child) => {
		const segment = nameByComponent.get(child);
		if (!segment) {
			return;
		}
		out[segment] = buildOverviewNode(child, depth - 1, opts);
	});
	node.children = out;
	return node;
}
export function pageOverview(opts = {}) {
	const depth = opts.depth ?? Infinity;
	const nameByComponent = getIndex().nameByComponent;
	if (opts.root) {
		const rootSegment = nameByComponent.get(opts.root) ?? opts.root.tagName?.toLowerCase() ?? 'root';
		return {
			[rootSegment]: buildOverviewNode(opts.root, depth - 1, opts),
		};
	}
	const out = {};
	getRoots().forEach((root) => {
		const segment = nameByComponent.get(root);
		if (!segment) {
			return;
		}
		out[segment] = buildOverviewNode(root, depth - 1, opts);
	});
	return out;
}
export function peek(path, opts = {}) {
	const depth = opts.depth ?? Infinity;
	const component = resolvePath(path);
	if (!component) {
		return null;
	}
	const node = buildOverviewNode(component, depth, opts);
	node.path = path;
	return node;
}
export function getAncestorChain(component) {
	const out = [];
	let cursor = getParent(component);
	while (cursor) {
		out.push(cursor);
		cursor = getParent(cursor);
	}
	return out;
}
