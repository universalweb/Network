import { isFunction } from '../../utilities.js';
let counter = 0;
function makeId() {
	counter += 1;
	return `local-${Date.now().toString(36)}-${counter.toString(36)}`;
}
export class LocalTransport {
	constructor({ globalKey = 'viatAI', expose = true } = {}) {
		this.globalKey = globalKey;
		this.expose = expose;
		this.subscribers = new Set();
		this.onRequest = null;
		this.sessionId = null;
	}
	start({ sessionId, onRequest }) {
		this.sessionId = sessionId;
		this.onRequest = onRequest;
		if (!this.expose) {
			return;
		}
		const api = {
			sessionId,
			request: (method, params) => {
				return onRequest({
					jsonrpc: '2.0',
					id: makeId(),
					method,
					params,
				});
			},
			send: (method, params) => {
				return onRequest({
					jsonrpc: '2.0',
					method,
					params,
				});
			},
			subscribe: (handler) => {
				if (!isFunction(handler)) {
					return () => {};
				}
				this.subscribers.add(handler);
				return () => {
					this.subscribers.delete(handler);
				};
			},
		};
		globalThis[this.globalKey] = api;
	}
	notify(message) {
		this.subscribers.forEach((handler) => {
			try {
				handler(message);
			} catch (error) {
				queueMicrotask(() => {
					throw error;
				});
			}
		});
	}
	stop() {
		this.subscribers.clear();
		if (this.expose && globalThis[this.globalKey]?.sessionId === this.sessionId) {
			globalThis[this.globalKey] = undefined;
		}
		this.onRequest = null;
		this.sessionId = null;
	}
}
