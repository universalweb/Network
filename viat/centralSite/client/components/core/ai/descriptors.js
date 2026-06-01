import { isFunction, isPlainObject, isString } from '../utilities.js';
import {
	eachComponent,
	getComponentById,
	getComponentId,
	getTools,
} from './registry.js';
import {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	resolvePath,
} from './paths.js';
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
	const t = typeof value;
	if (t === 'number' || t === 'boolean') {
		return value;
	}
	if (t === 'string') {
		return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
	}
	if (t === 'function') {
		return '[fn]';
	}
	if (t === 'symbol' || t === 'bigint') {
		return value.toString();
	}
	if (Array.isArray(value)) {
		const sliced = value.slice(0, MAX_ARRAY);
		const out = new Array(sliced.length);
		for (let i = 0; i < sliced.length; i++) {
			out[i] = sanitize(sliced[i], depth + 1);
		}
		if (value.length > MAX_ARRAY) {
			out.push(`[+${value.length - MAX_ARRAY} more]`);
		}
		return out;
	}
	if (value instanceof Element) {
		return `<${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''}>`;
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (isPlainObject(value)) {
		const out = {};
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			out[keys[i]] = sanitize(value[keys[i]], depth + 1);
		}
		return out;
	}
	return `[${t}]`;
}
function describeTools(component) {
	const tools = getTools(component);
	const out = [];
	tools.forEach((def, toolName) => {
		out.push({
			name: toolName,
			description: def.description ?? '',
			inputSchema: def.inputSchema ?? {
				type: 'object',
			},
			mutating: def.mutating === true,
		});
	});
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
	for (let i = 0; i < attrs.length; i++) {
		out[attrs[i].name] = attrs[i].value;
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
		desc.children = kids.map((child) => {
			return {
				name: getNameForComponent(child),
				path: getPathForComponent(child),
				id: getComponentId(child),
				tag: child.tagName.toLowerCase(),
				phase: child.phase ?? null,
			};
		});
	}
	return desc;
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
	if (reference instanceof Element) {
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
	eachComponent((component, id) => {
		if (component.tagName.toLowerCase() === target) {
			out.push({
				id,
				component,
			});
		}
	});
	return out;
}
export function queryByLabel(query) {
	if (!isString(query) || !query.trim()) {
		return [];
	}
	const needle = query.trim().toLowerCase();
	const out = [];
	eachComponent((component, id) => {
		const label = component.getAttribute('aria-label') ?? component.constructor.aiLabel ?? '';
		const description = component.constructor.aiDescription ?? '';
		const text = component.textContent ?? '';
		if (label.toLowerCase().includes(needle) || description.toLowerCase().includes(needle) || text.toLowerCase().includes(needle)) {
			out.push({
				id,
				component,
			});
		}
	});
	return out;
}
export { sanitize };
