import { defaultLogger } from '../debug/logger.js';
import { isFunction, isPromiseLike } from '../utilities.js';
import { enableAiFor } from './mixin.js';
import { dispatch } from './protocol.js';
import { subscribe as subscribeRegistry } from './registry.js';
function makeNotification(type, payload) {
	return {
		jsonrpc: '2.0',
		method: `ai.${type}`,
		params: payload,
	};
}
/*
 * Async settle for a transport whose start() returned a thenable — awaits it
 * unobserved (context as args, invoked unawaited) so a startup failure logs
 * and detaches instead of surfacing as an unhandled rejection.
 */
async function settleTransportStart(aiHost, startResult, transport) {
	try {
		await startResult;
	} catch (error) {
		defaultLogger.error('ai-host', 'transport start failed', error);
		aiHost.detach(transport);
	}
}
export class AIHost {
	constructor() {
		this.transports = new Set();
		this.sessionCounter = 0;
		this.unsubscribeRegistry = subscribeRegistry((registryEvent) => {
			this.onRegistryEvent(registryEvent);
		});
	}
	onRegistryEvent(registryEvent) {
		this.broadcast(makeNotification(registryEvent.type, registryEvent));
	}
	attach(transport) {
		/*
		 * A transport attaching is an agent arriving — the moment AI is genuinely
		 * needed, so arm the lazy registry here (idempotent; backfills the live tree
		 * once). Sourced off globalThis so the AI module stays decoupled from base.js
		 * (mirrors the class-parameterized mixin); a no-op if the core never loaded.
		 */
		enableAiFor(globalThis.WebComponent);
		if (this.transports.has(transport)) {
			return () => {
				return this.detach(transport);
			};
		}
		this.sessionCounter += 1;
		const sessionId = this.sessionCounter;
		this.transports.add(transport);
		const ctx = {
			sessionId,
			transport,
		};
		const startResult = transport.start({
			sessionId,
			onRequest: (message) => {
				return dispatch(message, ctx);
			},
			onClose: () => {
				this.detach(transport);
			},
		});
		if (isPromiseLike(startResult)) {
			settleTransportStart(this, startResult, transport);
		}
		defaultLogger.info('ai-host', `transport attached (session=${sessionId})`);
		return () => {
			return this.detach(transport);
		};
	}
	detach(transport) {
		if (!this.transports.has(transport)) {
			return;
		}
		this.transports.delete(transport);
		try {
			transport.stop?.();
		} catch (error) {
			defaultLogger.warn('ai-host', 'transport stop error', error);
		}
	}
	broadcast(message) {
		/* Set for…of is delete-safe: a notify() that detaches mid-broadcast just
		   drops the entry from the remaining iteration. */
		for (const transport of this.transports) {
			if (!isFunction(transport.notify)) {
				continue;
			}
			try {
				transport.notify(message);
			} catch (error) {
				defaultLogger.warn('ai-host', 'broadcast error', error);
			}
		}
	}
	destroy() {
		for (const transport of this.transports) {
			try {
				transport.stop?.();
			} catch (error) {
				defaultLogger.warn('ai-host', 'transport stop error', error);
			}
		}
		this.transports.clear();
		this.unsubscribeRegistry?.();
		this.unsubscribeRegistry = null;
	}
}
export const host = new AIHost();
