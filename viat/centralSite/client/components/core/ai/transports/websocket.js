import { defaultLogger } from '../../debug/logger.js';
const STATE_OPEN = 1;
export class WebSocketTransport {
	constructor({
		url,
		token,
		protocols,
		reconnect = true,
		minReconnectMs = 500,
		maxReconnectMs = 30000,
		heartbeatMs = 25000,
	}) {
		if (!url) {
			throw new TypeError('WebSocketTransport requires a url');
		}
		this.url = url;
		this.token = token;
		this.protocols = protocols;
		this.reconnect = reconnect;
		this.minReconnectMs = minReconnectMs;
		this.maxReconnectMs = maxReconnectMs;
		this.heartbeatMs = heartbeatMs;
		this.currentDelay = minReconnectMs;
		this.alive = true;
		this.ws = null;
		this.heartbeatTimer = null;
		this.reconnectTimer = null;
		this.onRequest = null;
	}
	buildUrl() {
		if (!this.token) {
			return this.url;
		}
		const sep = this.url.includes('?') ? '&' : '?';
		return `${this.url}${sep}token=${encodeURIComponent(this.token)}`;
	}
	start({ onRequest }) {
		this.onRequest = onRequest;
		this.connect();
	}
	/*
	 * The transport itself is the listener (handleEvent contract): one object
	 * registered for all four socket events — no per-connect handler closures,
	 * and every reconnect reuses the same listener identity.
	 */
	connect() {
		if (!this.alive) {
			return;
		}
		const ws = new WebSocket(this.buildUrl(), this.protocols);
		this.ws = ws;
		ws.addEventListener('open', this);
		ws.addEventListener('message', this);
		ws.addEventListener('error', this);
		ws.addEventListener('close', this);
	}
	handleEvent(socketEvent) {
		if (socketEvent.type === 'message') {
			return this.handleSocketMessage(socketEvent);
		}
		if (socketEvent.type === 'open') {
			return this.handleSocketOpen();
		}
		if (socketEvent.type === 'close') {
			return this.handleSocketClose();
		}
		if (socketEvent.type === 'error') {
			return this.handleSocketError(socketEvent);
		}
	}
	handleSocketOpen() {
		this.currentDelay = this.minReconnectMs;
		defaultLogger.info('ai-ws', `connected ${this.url}`);
		this.startHeartbeat();
	}
	async handleSocketMessage(messageEvent) {
		let message;
		try {
			message = JSON.parse(messageEvent.data);
		} catch (error) {
			defaultLogger.warn('ai-ws', 'parse error', error);
			return;
		}
		if (!message || message.jsonrpc !== '2.0') {
			return;
		}
		if (!message.method) {
			return;
		}
		const reply = await this.onRequest(message);
		if (reply) {
			this.send(reply);
		}
	}
	handleSocketError(errorEvent) {
		defaultLogger.warn('ai-ws', 'error', errorEvent?.message ?? errorEvent);
	}
	handleSocketClose() {
		this.stopHeartbeat();
		this.ws = null;
		if (!this.alive || !this.reconnect) {
			return;
		}
		this.scheduleReconnect();
	}
	scheduleReconnect() {
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = setTimeout(() => {
			this.connect();
		}, this.currentDelay);
		this.currentDelay = Math.min(this.currentDelay * 2, this.maxReconnectMs);
	}
	sendHeartbeat() {
		if (this.ws?.readyState !== STATE_OPEN) {
			return;
		}
		this.send({
			jsonrpc: '2.0',
			method: 'ai.heartbeat',
			params: {
				t: Date.now(),
			},
		});
	}
	startHeartbeat() {
		this.stopHeartbeat();
		if (!this.heartbeatMs) {
			return;
		}
		this.heartbeatTimer = setInterval(() => {
			this.sendHeartbeat();
		}, this.heartbeatMs);
	}
	stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}
	send(message) {
		if (this.ws?.readyState !== STATE_OPEN) {
			return false;
		}
		try {
			this.ws.send(JSON.stringify(message));
			return true;
		} catch (error) {
			defaultLogger.warn('ai-ws', 'send error', error);
			return false;
		}
	}
	notify(message) {
		this.send(message);
	}
	stop() {
		this.alive = false;
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
		this.stopHeartbeat();
		// Argless close() has no throw path (spec) — no guard needed.
		this.ws?.close();
		this.ws = null;
		this.onRequest = null;
	}
}
