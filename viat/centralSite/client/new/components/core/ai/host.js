import { Logger } from '../debug/logger.js';
import { isFunction } from '../utilities.js';
import { dispatch } from './protocol.js';
import { subscribe as subscribeRegistry } from './registry.js';
function makeNotification(type, payload) {
	return {
		jsonrpc: '2.0',
		method: `ai.${type}`,
		params: payload,
	};
}
export class AIHost {
	constructor() {
		this.transports = new Set();
		this.sessionCounter = 0;
		this.unsubscribeRegistry = subscribeRegistry((event) => {
			this.broadcast(makeNotification(event.type, event));
		});
	}
	attach(transport) {
		if (this.transports.has(transport)) {
			return () => this.detach(transport);
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
		if (startResult?.catch) {
			startResult.catch((error) => {
				Logger.error('ai-host', 'transport start failed', error);
				this.detach(transport);
			});
		}
		Logger.info('ai-host', `transport attached (session=${sessionId})`);
		return () => this.detach(transport);
	}
	detach(transport) {
		if (!this.transports.has(transport)) {
			return;
		}
		this.transports.delete(transport);
		try {
			transport.stop?.();
		} catch (error) {
			Logger.warn('ai-host', 'transport stop error', error);
		}
	}
	broadcast(message) {
		this.transports.forEach((transport) => {
			if (isFunction(transport.notify)) {
				try {
					transport.notify(message);
				} catch (error) {
					Logger.warn('ai-host', 'broadcast error', error);
				}
			}
		});
	}
	destroy() {
		this.transports.forEach((transport) => {
			try {
				transport.stop?.();
			} catch (error) {
				Logger.warn('ai-host', 'transport stop error', error);
			}
		});
		this.transports.clear();
		this.unsubscribeRegistry?.();
		this.unsubscribeRegistry = null;
	}
}
export const host = new AIHost();
