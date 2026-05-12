import {
	defineGlobalTool,
	defineInstanceTool,
	defineTagTool,
} from './registry.js';
import { isFunction, isPlainObject, isString } from '../utilities.js';
export function defineTool(scope, name, def) {
	if (!isString(name) || !name.trim()) {
		throw new TypeError('tool name must be a non-empty string');
	}
	if (!isPlainObject(def) || !isFunction(def.handler)) {
		throw new TypeError('tool definition requires a handler function');
	}
	if (scope === 'global' || scope === undefined || scope === null) {
		return defineGlobalTool(name, def);
	}
	if (isString(scope) && scope.startsWith('tag:')) {
		return defineTagTool(scope.slice(4), name, def);
	}
	if (scope instanceof Element) {
		return defineInstanceTool(scope, name, def);
	}
	throw new TypeError('scope must be "global", "tag:<tagname>", or a component instance');
}
function getStatePath(state, path) {
	if (!path) {
		return state;
	}
	return path.split('.').reduce((acc, key) => {
		return acc?.[key];
	}, state);
}
function setStatePath(target, path, value) {
	const parts = path.split('.');
	const last = parts.pop();
	let cursor = target;
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (!isPlainObject(cursor[part]) && !Array.isArray(cursor[part])) {
			cursor[part] = {};
		}
		cursor = cursor[part];
	}
	cursor[last] = value;
}
defineGlobalTool('click', {
	description: 'Trigger a native click on the component.',
	inputSchema: {
		type: 'object',
		properties: {},
	},
	mutating: true,
	handler({ component }) {
		component.click?.();
		return {
			ok: true,
		};
	},
});
defineGlobalTool('focus', {
	description: 'Move keyboard focus to the component.',
	inputSchema: {
		type: 'object',
		properties: {
			preventScroll: {
				type: 'boolean',
			},
		},
	},
	mutating: true,
	handler({
		component, args,
	}) {
		component.focus?.({
			preventScroll: args?.preventScroll === true,
		});
		return {
			ok: true,
		};
	},
});
defineGlobalTool('blur', {
	description: 'Remove keyboard focus from the component.',
	inputSchema: {
		type: 'object',
		properties: {},
	},
	mutating: true,
	handler({ component }) {
		component.blur?.();
		return {
			ok: true,
		};
	},
});
defineGlobalTool('scrollIntoView', {
	description: 'Scroll the component into the viewport.',
	inputSchema: {
		type: 'object',
		properties: {
			behavior: {
				type: 'string',
				enum: ['auto', 'smooth'],
			},
			block: {
				type: 'string',
				enum: [
					'start', 'center', 'end', 'nearest',
				],
			},
			inline: {
				type: 'string',
				enum: [
					'start', 'center', 'end', 'nearest',
				],
			},
		},
	},
	mutating: true,
	handler({
		component, args,
	}) {
		component.scrollIntoView?.({
			behavior: args?.behavior ?? 'smooth',
			block: args?.block ?? 'center',
			inline: args?.inline ?? 'nearest',
		});
		return {
			ok: true,
		};
	},
});
defineGlobalTool('getState', {
	description: 'Read the component state, optionally at a dot path.',
	inputSchema: {
		type: 'object',
		properties: {
			path: {
				type: 'string',
			},
		},
	},
	mutating: false,
	handler({
		component, args,
	}) {
		return getStatePath(component.STATE ?? {}, args?.path);
	},
});
defineGlobalTool('setState', {
	description: 'Patch component state at a dot path. Triggers a re-render.',
	inputSchema: {
		type: 'object',
		properties: {
			path: {
				type: 'string',
			},
			value: {},
		},
		required: ['path'],
	},
	mutating: true,
	handler({
		component, args,
	}) {
		const path = args?.path;
		if (!isString(path) || !path.length) {
			throw new TypeError('path is required');
		}
		const proxy = component.state;
		if (!proxy) {
			throw new Error('component has no state proxy');
		}
		setStatePath(proxy, path, args.value);
		return {
			ok: true,
		};
	},
});
defineGlobalTool('emit', {
	description: 'Dispatch a custom event from the component.',
	inputSchema: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
			},
			data: {},
		},
		required: ['name'],
	},
	mutating: true,
	handler({
		component, args,
	}) {
		if (isFunction(component.emit)) {
			component.emit(args.name, args.data ?? {});
		} else {
			component.dispatchEvent(new CustomEvent(args.name, {
				bubbles: true,
				composed: true,
				detail: {
					data: args.data ?? {},
				},
			}));
		}
		return {
			ok: true,
		};
	},
});
defineGlobalTool('getAttribute', {
	description: 'Read an HTML attribute value.',
	inputSchema: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
			},
		},
		required: ['name'],
	},
	mutating: false,
	handler({
		component, args,
	}) {
		return component.getAttribute(args.name);
	},
});
defineGlobalTool('setAttribute', {
	description: 'Write an HTML attribute value.',
	inputSchema: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
			},
			value: {
				type: 'string',
			},
		},
		required: ['name', 'value'],
	},
	mutating: true,
	handler({
		component, args,
	}) {
		component.setAttribute(args.name, args.value);
		return {
			ok: true,
		};
	},
});
defineGlobalTool('getBounds', {
	description: 'Get the component bounding rect in viewport coordinates.',
	inputSchema: {
		type: 'object',
		properties: {},
	},
	mutating: false,
	handler({ component }) {
		const rect = component.getBoundingClientRect();
		return {
			x: rect.x,
			y: rect.y,
			w: rect.width,
			h: rect.height,
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
		};
	},
});
