import {
	eachComponent,
	getComponentId,
	getTools,
	subscribe,
} from '../registry.js';
import { isFunction, isTypeUndefined } from '../../utilities.js';
import { Logger } from '../../debug/logger.js';
function detectMcp() {
	if (isTypeUndefined(typeof navigator)) {
		return null;
	}
	if (navigator.mcp) {
		return navigator.mcp;
	}
	if (globalThis.mcp) {
		return globalThis.mcp;
	}
	return null;
}
function buildToolKey(componentId, toolName) {
	return `${componentId}:${toolName}`;
}
function buildToolDescriptor(componentId, toolName, def, executor) {
	return {
		name: buildToolKey(componentId, toolName),
		title: def.title ?? toolName,
		description: def.description ?? '',
		inputSchema: def.inputSchema ?? {
			type: 'object',
		},
		annotations: {
			componentId,
			toolName,
			mutating: def.mutating === true,
			...def.annotations,
		},
		execute: executor,
	};
}
export class WebMCPTransport {
	constructor({
		siteName, autoPublish = true,
	} = {}) {
		this.siteName = siteName ?? (typeof location !== 'undefined' ? location.hostname : 'site');
		this.autoPublish = autoPublish;
		this.registered = new Map();
		this.onRequest = null;
		this.unsubscribeRegistry = null;
		this.mcp = null;
	}
	isAvailable() {
		return detectMcp() !== null;
	}
	start({ onRequest }) {
		this.onRequest = onRequest;
		this.mcp = detectMcp();
		if (!this.mcp) {
			Logger.warn('ai-mcp', 'navigator.mcp unavailable; transport idle');
			return;
		}
		if (this.autoPublish) {
			this.publishAll();
			this.unsubscribeRegistry = subscribe((event) => {
				if (event.type === 'componentAdded') {
					const component = this.findById(event.id);
					if (component) {
						this.publishComponent(event.id, component);
					}
				} else if (event.type === 'componentRemoved') {
					this.unpublishComponent(event.id);
				}
			});
		}
	}
	findById(id) {
		let found = null;
		eachComponent((component, currentId) => {
			if (currentId === id) {
				found = component;
			}
		});
		return found;
	}
	publishAll() {
		eachComponent((component, id) => {
			this.publishComponent(id, component);
		});
	}
	publishComponent(id, component) {
		const tools = getTools(component);
		tools.forEach((def, toolName) => {
			const key = buildToolKey(id, toolName);
			if (this.registered.has(key)) {
				return;
			}
			const descriptor = buildToolDescriptor(id, toolName, def, async (args) => {
				return this.invokeRemoteTool(id, toolName, args);
			});
			const unregister = this.mcp.registerTool ? this.mcp.registerTool(descriptor) : this.mcp.tools?.register?.(descriptor);
			if (isFunction(unregister)) {
				this.registered.set(key, unregister);
			} else if (unregister && isFunction(unregister.unregister)) {
				this.registered.set(key, () => {
					return unregister.unregister();
				});
			} else {
				this.registered.set(key, () => {});
			}
		});
	}
	unpublishComponent(id) {
		const prefix = `${id}:`;
		this.registered.forEach((unregister, key) => {
			if (!key.startsWith(prefix)) {
				return;
			}
			try {
				unregister();
			} catch (error) {
				Logger.warn('ai-mcp', 'unregister error', error);
			}
			this.registered.delete(key);
		});
	}
	async invokeRemoteTool(id, toolName, args) {
		const reply = await this.onRequest({
			jsonrpc: '2.0',
			id: `mcp:${id}:${toolName}:${Date.now().toString(36)}`,
			method: 'ai.callTool',
			params: {
				id,
				tool: toolName,
				args,
			},
		});
		if (reply?.error) {
			throw new Error(reply.error.message);
		}
		return reply?.result ?? null;
	}
	notify() {
		// MCP clients pull tool/resource lists; nothing to push here yet.
	}
	stop() {
		this.unsubscribeRegistry?.();
		this.unsubscribeRegistry = null;
		this.registered.forEach((unregister) => {
			try {
				unregister();
			} catch (error) {
				Logger.warn('ai-mcp', 'unregister error', error);
			}
		});
		this.registered.clear();
		this.mcp = null;
		this.onRequest = null;
	}
}
export function getMcpToolDescriptors() {
	const out = [];
	eachComponent((component, id) => {
		const tools = getTools(component);
		tools.forEach((def, toolName) => {
			out.push({
				name: buildToolKey(id, toolName),
				description: def.description ?? '',
				inputSchema: def.inputSchema ?? {
					type: 'object',
				},
				annotations: {
					componentId: id,
					toolName,
					mutating: def.mutating === true,
				},
			});
		});
	});
	return out;
}
export { detectMcp };
