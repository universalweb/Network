import { defaultLogger } from '../../debug/logger.js';
import { isFunction, isTypeUndefined } from '../../utilities.js';
import {
	componentEntries,
	getComponentById,
	getTools,
	subscribe,
} from '../registry.js';
function noopUnregister() {}
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
		this.siteName = siteName ?? globalThis.location?.hostname ?? 'site';
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
			defaultLogger.warn('ai-mcp', 'navigator.mcp unavailable; transport idle');
			return;
		}
		if (this.autoPublish) {
			this.publishAll();
			this.unsubscribeRegistry = subscribe((registryEvent) => {
				this.onRegistryEvent(registryEvent);
			});
		}
	}
	onRegistryEvent(registryEvent) {
		if (registryEvent.type === 'componentAdded') {
			const component = getComponentById(registryEvent.id);
			if (component) {
				this.publishComponent(registryEvent.id, component);
			}
			return;
		}
		if (registryEvent.type === 'componentRemoved') {
			this.unpublishComponent(registryEvent.id);
		}
	}
	publishAll() {
		for (const [
			id,
			component,
		] of componentEntries()) {
			this.publishComponent(id, component);
		}
	}
	publishComponent(id, component) {
		const tools = getTools(component);
		for (const [
			toolName,
			def,
		] of tools) {
			const key = buildToolKey(id, toolName);
			if (this.registered.has(key)) {
				continue;
			}
			/* The executor arrow is the MCP-forced callback shape (needs id/tool
			   context) — a thin async forward to the named method. */
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
				this.registered.set(key, noopUnregister);
			}
		}
	}
	/*
	 * Third-party unregister callbacks (browser-agent MCP surface) are
	 * uncheckable external code — best-effort teardown, warn and continue.
	 */
	safeUnregister(unregister) {
		try {
			unregister();
		} catch (error) {
			defaultLogger.warn('ai-mcp', 'unregister error', error);
		}
	}
	unpublishComponent(id) {
		const prefix = `${id}:`;
		/* Map for…of tolerates deleting the current entry. */
		for (const [
			key,
			unregister,
		] of this.registered) {
			if (!key.startsWith(prefix)) {
				continue;
			}
			this.safeUnregister(unregister);
			this.registered.delete(key);
		}
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
		for (const unregister of this.registered.values()) {
			this.safeUnregister(unregister);
		}
		this.registered.clear();
		this.mcp = null;
		this.onRequest = null;
	}
}
export function getMcpToolDescriptors() {
	const out = [];
	for (const [
		id,
		component,
	] of componentEntries()) {
		const tools = getTools(component);
		for (const [
			toolName,
			def,
		] of tools) {
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
		}
	}
	return out;
}
export { detectMcp };
