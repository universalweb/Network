import { isFunction, isString } from '../utilities.js';
import { check } from './permissions.js';
import {
	describeComponent,
	queryByLabel,
	queryByTag,
	resolveByIdOrPath,
} from './descriptors.js';
import {
	getComponentId,
	getTools,
	listComponents,
} from './registry.js';
import {
	getPathForComponent,
	listPaths,
	pageOverview,
	peek,
	resolvePath,
} from './paths.js';
import { highlight, visualPageMap } from './visual.js';
export const ERROR_CODES = {
	parse: -32700,
	invalidRequest: -32600,
	methodNotFound: -32601,
	invalidParams: -32602,
	internal: -32603,
	unauthorized: -32000,
	notFound: -32001,
};
export function makeError(code, message, data) {
	const error = {
		code,
		message,
	};
	if (data !== undefined) {
		error.data = data;
	}
	return error;
}
function notFound(reference) {
	return makeError(ERROR_CODES.notFound, `Component ${reference} not found`);
}
function invalidParams(message) {
	return makeError(ERROR_CODES.invalidParams, message);
}
function findFromParams(params) {
	const path = params?.path;
	const id = params?.id;
	if (!path && !id) {
		throw invalidParams('id or path is required');
	}
	const component = resolveByIdOrPath(params);
	if (!component) {
		throw notFound(path ?? id);
	}
	return component;
}
/*
 * Method registry as a Map so registerMethod's cleanup can use map.delete()
 * instead of the `delete` keyword (V8 deopt). Built-in handlers are inserted
 * up front; user-registered methods append.
 */
const handlers = new Map();
handlers.set('ai.listComponents', () => {
	return listComponents().map(({ id, component }) => {
		return {
			id,
			path: getPathForComponent(component),
			tag: component.tagName.toLowerCase(),
			role: component.constructor.aiRole ?? null,
			label: component.getAttribute('aria-label') ?? component.constructor.aiLabel ?? null,
		};
	});
});
handlers.set('ai.pageOverview', (params) => {
	return pageOverview(params ?? {});
});
handlers.set('ai.peek', (params) => {
	const path = params?.path;
	if (!isString(path) || !path.length) {
		throw invalidParams('path is required');
	}
	const result = peek(path, params);
	if (!result) {
		throw notFound(path);
	}
	return result;
});
handlers.set('ai.inspect', (params) => {
	return describeComponent(findFromParams(params), params);
});
handlers.set('ai.describeComponent', (params) => {
	return describeComponent(findFromParams(params), params);
});
handlers.set('ai.visualPageMap', (params) => {
	return visualPageMap(params ?? {});
});
handlers.set('ai.resolvePath', (params) => {
	const component = resolvePath(params?.path);
	if (!component) {
		return null;
	}
	return {
		id: component.id || null,
		path: params.path,
		tag: component.tagName.toLowerCase(),
	};
});
handlers.set('ai.listPaths', () => {
	return listPaths();
});
handlers.set('ai.queryState', (params) => {
	const component = findFromParams(params);
	const state = component.STATE ?? {};
	const statePath = params?.statePath;
	if (!statePath) {
		return state;
	}
	return statePath.split('.').reduce((acc, key) => {
		return acc?.[key];
	}, state);
});
handlers.set('ai.listTools', (params) => {
	if (params?.id || params?.path) {
		const component = findFromParams(params);
		const list = [];
		getTools(component).forEach((def, toolName) => {
			list.push({
				name: toolName,
				description: def.description ?? '',
				inputSchema: def.inputSchema ?? {
					type: 'object',
				},
				mutating: def.mutating === true,
			});
		});
		return list;
	}
	const seen = new Set();
	const list = [];
	listComponents().forEach(({ component }) => {
		getTools(component).forEach((def, toolName) => {
			if (seen.has(toolName)) {
				return;
			}
			seen.add(toolName);
			list.push({
				name: toolName,
				description: def.description ?? '',
				inputSchema: def.inputSchema ?? {
					type: 'object',
				},
				mutating: def.mutating === true,
			});
		});
	});
	return list;
});
handlers.set('ai.callTool', async (params, ctx) => {
	const component = findFromParams(params);
	const toolName = params?.tool;
	if (!isString(toolName) || !toolName.length) {
		throw invalidParams('tool is required');
	}
	const tools = getTools(component);
	const def = tools.get(toolName);
	if (!def) {
		throw makeError(ERROR_CODES.methodNotFound, `Tool ${toolName} not found on ${params.path ?? params.id}`);
	}
	const action = {
		tool: toolName,
		componentId: getComponentId(component),
		componentPath: getPathForComponent(component),
		mutating: def.mutating === true,
	};
	const allowed = await check(action, ctx);
	if (!allowed) {
		throw makeError(ERROR_CODES.unauthorized, `Tool ${toolName} denied`);
	}
	const result = await def.handler({
		component,
		args: params.args,
		ctx,
	});
	return result ?? null;
});
handlers.set('ai.queryByTag', (params) => {
	return queryByTag(params?.tag).map(({ id, component }) => {
		return {
			id,
			path: getPathForComponent(component),
			tag: component.tagName.toLowerCase(),
		};
	});
});
handlers.set('ai.queryByLabel', (params) => {
	return queryByLabel(params?.query).map(({ id, component }) => {
		return {
			id,
			path: getPathForComponent(component),
			tag: component.tagName.toLowerCase(),
		};
	});
});
handlers.set('ai.highlight', (params) => {
	const component = findFromParams(params);
	highlight(component, params);
	return {
		ok: true,
	};
});
handlers.set('ai.ping', () => {
	return {
		t: Date.now(),
	};
});
export function registerMethod(methodName, handler) {
	if (!isString(methodName) || !isFunction(handler)) {
		throw new TypeError('registerMethod requires (methodName, handler)');
	}
	handlers.set(methodName, handler);
	return () => {
		if (handlers.get(methodName) === handler) {
			handlers.delete(methodName);
		}
	};
}
export function getMethod(methodName) {
	return handlers.get(methodName) ?? null;
}
export async function dispatch(message, ctx = {}) {
	const id = message?.id ?? null;
	if (!message || message.jsonrpc !== '2.0' || !isString(message.method)) {
		return {
			jsonrpc: '2.0',
			id,
			error: makeError(ERROR_CODES.invalidRequest, 'Invalid JSON-RPC request'),
		};
	}
	const handler = handlers.get(message.method);
	if (!handler) {
		return {
			jsonrpc: '2.0',
			id,
			error: makeError(ERROR_CODES.methodNotFound, `Unknown method ${message.method}`),
		};
	}
	try {
		const result = await handler(message.params ?? {}, ctx);
		if (id === null || id === undefined) {
			return null;
		}
		return {
			jsonrpc: '2.0',
			id,
			result: result ?? null,
		};
	} catch (error) {
		if (error && typeof error.code === 'number' && typeof error.message === 'string') {
			return {
				jsonrpc: '2.0',
				id,
				error,
			};
		}
		return {
			jsonrpc: '2.0',
			id,
			error: makeError(ERROR_CODES.internal, error?.message ?? 'Internal error'),
		};
	}
}
