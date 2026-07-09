import {
	isDate, isElement, isFunction, isPlainObject, isString,
} from '../utilities.js';
import {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	resolvePath,
} from './paths.js';
import {
	componentEntries,
	getComponentById,
	getComponentId,
	getTools,
} from './registry.js';
const MAX_DEPTH = 4;
const MAX_ARRAY = 50;
const MAX_STRING = 600;
function sanitize(value, depth) {
	if (depth > MAX_DEPTH) {
		return '[depth-limit]';
	}
	if (value === null || value === undefined) {
		return value;
	}
	const valueType = typeof value;
	if (valueType === 'number' || valueType === 'boolean') {
		return value;
	}
	if (valueType === 'string') {
		return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
	}
	if (valueType === 'function') {
		return '[fn]';
	}
	if (valueType === 'symbol' || valueType === 'bigint') {
		return value.toString();
	}
	if (Array.isArray(value)) {
		const sliced = value.slice(0, MAX_ARRAY);
		const out = new Array(sliced.length);
		const slicedLength = sliced.length;
		for (let index = 0; index < slicedLength; index++) {
			out[index] = sanitize(sliced[index], depth + 1);
		}
		if (value.length > MAX_ARRAY) {
			out.push(`[+${value.length - MAX_ARRAY} more]`);
		}
		return out;
	}
	if (isElement(value)) {
		return `<${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''}>`;
	}
	if (isDate(value)) {
		return value.toISOString();
	}
	if (isPlainObject(value)) {
		const out = {};
		const keys = Object.keys(value);
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			out[keys[index]] = sanitize(value[keys[index]], depth + 1);
		}
		return out;
	}
	return `[${valueType}]`;
}
export function describeTool(def, toolName) {
	return {
		name: toolName,
		description: def.description ?? '',
		inputSchema: def.inputSchema ?? {
			type: 'object',
		},
		mutating: def.mutating === true,
	};
}
export function describeTools(component) {
	const tools = getTools(component);
	const out = [];
	for (const [
		toolName,
		def,
	] of tools) {
		out.push(describeTool(def, toolName));
	}
	return out;
}
function describeBounds(component) {
	if (!component.isConnected) {
		return null;
	}
	const rect = component.getBoundingClientRect();
	const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < globalThis.innerHeight && rect.left < globalThis.innerWidth;
	return {
		x: Math.round(rect.x),
		y: Math.round(rect.y),
		w: Math.round(rect.width),
		h: Math.round(rect.height),
		visible: rect.width > 0 && rect.height > 0,
		inViewport,
	};
}
function collectAttributes(component) {
	const out = {};
	const attrs = component.attributes;
	const attrsLength = attrs.length;
	for (let index = 0; index < attrsLength; index++) {
		out[attrs[index].name] = attrs[index].value;
	}
	return out;
}
function collectTextSnippet(component) {
	const root = component.shadowRoot ?? component;
	const text = root.textContent?.trim() ?? '';
	if (!text) {
		return '';
	}
	const condensed = text.replace(/\s+/g, ' ');
	return condensed.length > 240 ? `${condensed.slice(0, 240)}…` : condensed;
}
export function describeComponent(component, opts = {}) {
	const includeChildren = opts.includeChildren !== false;
	const includeState = opts.includeState !== false;
	const includeText = opts.includeText !== false;
	const includeTools = opts.includeTools !== false;
	const includeRefs = opts.includeRefs !== false;
	const id = getComponentId(component);
	const path = getPathForComponent(component);
	const ariaLabel = component.getAttribute('aria-label');
	const desc = {
		id,
		path,
		tag: component.tagName.toLowerCase(),
		phase: component.phase ?? null,
		role: component.constructor.aiRole ?? component.getAttribute('role') ?? null,
		label: ariaLabel ?? component.constructor.aiLabel ?? null,
		description: component.constructor.aiDescription ?? '',
		attributes: collectAttributes(component),
		bounds: describeBounds(component),
		visibility: {
			isConnected: component.isConnected,
			isRendered: component.isRendered === true,
			isMounted: component.isMounted === true,
			isLive: component.isLive === true,
			isVisible: component.isVisible === true,
			isIntersecting: component.isIntersecting === true,
			isIntersected: component.isIntersected === true,
		},
	};
	if (includeRefs && component.refsMap) {
		desc.refs = Object.keys(component.refsMap);
	}
	if (includeText) {
		desc.text = collectTextSnippet(component);
	}
	if (includeTools) {
		desc.tools = describeTools(component);
	}
	if (includeState && isPlainObject(component.STATE)) {
		const projector = isFunction(component.constructor.aiState) ? component.constructor.aiState : null;
		const raw = projector ? projector(component) : component.STATE;
		desc.state = sanitize(raw, 0);
	}
	if (includeChildren) {
		const kids = getDirectChildren(component);
		desc.children = kids.map(describeChildNode);
	}
	return desc;
}
function describeChildNode(child) {
	return {
		name: getNameForComponent(child),
		path: getPathForComponent(child),
		id: getComponentId(child),
		tag: child.tagName.toLowerCase(),
		phase: child.phase ?? null,
	};
}
export function inspect(reference, opts) {
	const component = resolveReference(reference);
	if (!component) {
		return null;
	}
	return describeComponent(component, opts);
}
export function resolveReference(reference) {
	if (!reference) {
		return null;
	}
	if (isElement(reference)) {
		return reference;
	}
	if (!isString(reference)) {
		return null;
	}
	if (reference.includes('.')) {
		return resolvePath(reference) ?? getComponentById(reference);
	}
	return getComponentById(reference) ?? resolvePath(reference);
}
export function resolveByIdOrPath(params) {
	if (!isPlainObject(params)) {
		return null;
	}
	if (params.path) {
		return resolvePath(params.path);
	}
	if (params.id) {
		return getComponentById(params.id);
	}
	return null;
}
export function queryByTag(tag) {
	const target = String(tag).toLowerCase();
	const out = [];
	for (const [
		id,
		component,
	] of componentEntries()) {
		if (component.tagName.toLowerCase() === target) {
			out.push({
				id,
				component,
			});
		}
	}
	return out;
}
function matchesLabelQuery(component, needle) {
	const label = component.getAttribute('aria-label') ?? component.constructor.aiLabel ?? '';
	const description = component.constructor.aiDescription ?? '';
	const text = component.textContent ?? '';
	return label.toLowerCase().includes(needle) || description.toLowerCase().includes(needle) || text.toLowerCase().includes(needle);
}
export function queryByLabel(query) {
	if (!isString(query) || !query.trim()) {
		return [];
	}
	const needle = query.trim().toLowerCase();
	const out = [];
	for (const [
		id,
		component,
	] of componentEntries()) {
		if (matchesLabelQuery(component, needle)) {
			out.push({
				id,
				component,
			});
		}
	}
	return out;
}
export { sanitize };
