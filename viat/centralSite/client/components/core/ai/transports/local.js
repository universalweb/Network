import { isFunction, queueAsyncError } from '../../utilities.js';
let counter = 0;
function makeId() {
	counter += 1;
	return `local-${Date.now().toString(36)}-${counter.toString(36)}`;
}
export class LocalTransport {
	constructor({
		globalKey = 'viatAI', expose = true,
	} = {}) {
		this.globalKey = globalKey;
		this.expose = expose;
		this.subscribers = new Set();
		this.onRequest = null;
		this.sessionId = null;
	}
	start({
		sessionId, onRequest,
	}) {
		this.sessionId = sessionId;
		this.onRequest = onRequest;
		if (!this.expose) {
			return;
		}
		/*
		 * Deliberately an object of arrows, NOT a class instance: viatAI is a
		 * public global console/agent API whose methods must survive
		 * destructuring (`const { request } = viatAI`) — prototype methods
		 * would lose `this`. One object per start(); allocation is a non-issue.
		 */
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
		for (const handler of this.subscribers) {
			try {
				handler(message);
			} catch (error) {
				queueAsyncError(error);
			}
		}
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
