/* eslint-disable no-restricted-syntax */
import {
	FRAME_TYPE,
	decodeFrame,
	encodeFrame,
} from './envelope.js';
import { Logger } from '../debug/logger.js';
/*
 * UniversalWebSocket — an all-in-one realtime client that ships with UWC and works
 * on any site. It OWNS a native WebSocket (composition, not inheritance: reconnect
 * needs a fresh underlying socket each time while this wrapper persists, holding the
 * pending-request map, the mode, and the handlers).
 * Dual-mode by the client's choice: `mode: 'json'` (zero-dep default) or `'cbor'`
 * (binary; the caller injects `options.cborCodec` = { encode, decode } so the core
 * stays zero-external). Hybrid request/response over the message channel: `ask()`
 * correlates a reply by id (a Promise), `send()` is fire-and-forget, `on()` registers
 * handlers for server-initiated asks/notifies (bidirectional). Reconnects with backoff
 * + heartbeat; in-flight asks reject on disconnect by default (no silent double-submit).
 * Dev-friendly usage:
 *   const socket = new UniversalWebSocket('wss://host/ws', { ticket });
 *   await socket.open();
 *   const account = await socket.ask('account.get', { address });
 *   socket.on('wallet.update', (data) => { ... });
 */
const SOCKET_OPEN = 1;
const DEFAULT_ASK_TIMEOUT_MS = 30000;
const DEFAULT_MAX_IN_FLIGHT = 256;
export class UniversalWebSocket {
	#ws = null;
	#pending = new Map();
	#handlers = new Map();
	#cborCodec = null;
	#nextId = 1;
	#heartbeatTimer = null;
	#reconnectTimer = null;
	#reconnectDelay = 0;
	#alive = true;
	#openResolve = null;
	#openReject = null;
	constructor(url, options = {}) {
		if (!url) {
			throw new TypeError('UniversalWebSocket requires a url');
		}
		this.url = url;
		this.mode = options.mode === 'cbor' ? 'cbor' : 'json';
		this.#cborCodec = options.cborCodec ?? null;
		this.ticket = options.ticket ?? null;
		/* Subprotocol doubles as the wire-format version so the envelope can evolve. */
		this.protocol = options.protocol ?? 'uws.v1';
		this.shouldReconnect = options.reconnect ?? true;
		this.minReconnectMs = options.minReconnectMs ?? 500;
		this.maxReconnectMs = options.maxReconnectMs ?? 30000;
		this.heartbeatMs = options.heartbeatMs ?? 25000;
		this.askTimeoutMs = options.askTimeoutMs ?? DEFAULT_ASK_TIMEOUT_MS;
		this.maxInFlight = options.maxInFlight ?? DEFAULT_MAX_IN_FLIGHT;
		this.#reconnectDelay = this.minReconnectMs;
	}
	get connected() {
		return this.#ws?.readyState === SOCKET_OPEN;
	}
	/**
	 * Open the connection. The returned promise resolves once the socket connects (or,
	 * when reconnect is on, on its first successful connect). CBOR mode requires a codec
	 * injected via options.cborCodec.
	 * @returns {Promise<UniversalWebSocket>} Resolves with this instance once connected.
	 */
	open() {
		this.#alive = true;
		if (this.mode === 'cbor' && !this.#cborCodec) {
			return Promise.reject(new TypeError('UniversalWebSocket: mode cbor requires options.cborCodec'));
		}
		this.#connect();
		return new Promise((resolve, reject) => {
			this.#openResolve = resolve;
			this.#openReject = reject;
		});
	}
	#buildUrl() {
		if (!this.ticket) {
			return this.url;
		}
		/* Single-use, short-TTL ticket (NOT a long-lived token) — query placement is
		 * safe because the ticket is spent on the upgrade and useless in any log. */
		const separator = this.url.includes('?') ? '&' : '?';
		return `${this.url}${separator}ticket=${encodeURIComponent(this.ticket)}`;
	}
	#connect() {
		if (!this.#alive) {
			return;
		}
		const socket = new WebSocket(this.#buildUrl(), this.protocol);
		socket.binaryType = 'arraybuffer';
		this.#ws = socket;
		socket.addEventListener('open', this);
		socket.addEventListener('message', this);
		socket.addEventListener('close', this);
		socket.addEventListener('error', this);
	}
	/**
	 * Single DOM-listener entry — the instance IS the listener (zero per-instance
	 * binding), routing every socket event from one place.
	 * @param {Event} domEvent - The WebSocket event.
	 */
	handleEvent(domEvent) {
		if (domEvent.type === 'message') {
			this.#onMessage(domEvent);
			return;
		}
		if (domEvent.type === 'open') {
			this.#reconnectDelay = this.minReconnectMs;
			Logger.info('uws', `connected ${this.url} (${this.mode})`);
			this.#startHeartbeat();
			this.#resolveOpen();
			return;
		}
		if (domEvent.type === 'close') {
			this.#onClose();
			return;
		}
		Logger.warn('uws', 'socket error', domEvent?.message ?? domEvent);
	}
	async #onMessage(domEvent) {
		const isBinary = typeof domEvent.data !== 'string';
		let envelope;
		try {
			envelope = decodeFrame(domEvent.data, isBinary, this.#cborCodec);
		} catch (decodeError) {
			Logger.warn('uws', 'decode error', decodeError);
			return;
		}
		await this.#route(envelope);
	}
	async #route(envelope) {
		const frameType = envelope.type;
		if (frameType === FRAME_TYPE.REPLY || frameType === FRAME_TYPE.ERROR) {
			this.#settle(envelope);
			return;
		}
		if (frameType === FRAME_TYPE.PING) {
			this.#sendEnvelope({
				type: FRAME_TYPE.PONG,
			});
			return;
		}
		if (frameType === FRAME_TYPE.PONG) {
			return;
		}
		const handler = this.#handlers.get(envelope.method);
		if (!handler) {
			if (frameType === FRAME_TYPE.ASK) {
				this.#sendEnvelope({
					type: FRAME_TYPE.ERROR,
					id: envelope.id,
					error: {
						code: 'method_not_found',
						message: envelope.method,
					},
				});
			}
			return;
		}
		if (frameType === FRAME_TYPE.NOTIFY) {
			handler(envelope.data, this);
			return;
		}
		await this.#answer(envelope, handler);
	}
	async #answer(envelope, handler) {
		try {
			const result = await handler(envelope.data, this);
			this.#sendEnvelope({
				type: FRAME_TYPE.REPLY,
				id: envelope.id,
				data: result,
			});
		} catch (handlerError) {
			this.#sendEnvelope({
				type: FRAME_TYPE.ERROR,
				id: envelope.id,
				error: {
					code: 'handler_error',
					message: handlerError?.message ?? 'handler failed',
				},
			});
		}
	}
	#settle(envelope) {
		const waiter = this.#pending.get(envelope.id);
		if (!waiter) {
			return;
		}
		this.#pending.delete(envelope.id);
		clearTimeout(waiter.timer);
		if (envelope.type === FRAME_TYPE.ERROR) {
			const error = new Error(envelope.error?.message ?? 'request failed');
			error.code = envelope.error?.code ?? 'error';
			waiter.reject(error);
			return;
		}
		waiter.resolve(envelope.data);
	}
	/**
	 * Send a request and await its correlated reply.
	 * @param {string} method - Route name.
	 * @param {*} [data] - Request params.
	 * @param {{timeoutMs?: number}} [options] - Per-call overrides such as timeoutMs.
	 * @returns {Promise<*>} Resolves with reply data; rejects on error/timeout/disconnect.
	 */
	ask(method, data, options = {}) {
		if (!this.connected) {
			return Promise.reject(new Error('UniversalWebSocket: not connected'));
		}
		if (this.#pending.size >= this.maxInFlight) {
			return Promise.reject(new Error('UniversalWebSocket: too many in-flight requests'));
		}
		const id = this.#nextId++;
		const timeoutMs = options.timeoutMs ?? this.askTimeoutMs;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#pending.delete(id);
				reject(new Error(`UniversalWebSocket: ask '${method}' timed out`));
			}, timeoutMs);
			this.#pending.set(id, {
				resolve,
				reject,
				timer,
			});
			const sent = this.#sendEnvelope({
				type: FRAME_TYPE.ASK,
				id,
				method,
				data,
			});
			if (!sent) {
				this.#pending.delete(id);
				clearTimeout(timer);
				reject(new Error('UniversalWebSocket: send failed'));
			}
		});
	}
	/**
	 * Fire-and-forget notification (no reply expected).
	 * @param {string} method - Route name.
	 * @param {*} [data] - Notification params.
	 * @returns {boolean} Whether the frame was written.
	 */
	send(method, data) {
		return this.#sendEnvelope({
			type: FRAME_TYPE.NOTIFY,
			method,
			data,
		});
	}
	/**
	 * Register a handler for a server-initiated ASK (return value is replied) or NOTIFY
	 * (return value ignored). One handler per method.
	 * @param {string} method - Route name.
	 * @param {Function} handler - `(data, socket) => result | Promise<result>`.
	 */
	on(method, handler) {
		this.#handlers.set(method, handler);
	}
	/**
	 * Remove a previously registered handler.
	 * @param {string} method - Route name.
	 */
	off(method) {
		this.#handlers.delete(method);
	}
	#sendEnvelope(envelope) {
		if (this.#ws?.readyState !== SOCKET_OPEN) {
			return false;
		}
		let frame;
		try {
			frame = encodeFrame(envelope, this.mode, this.#cborCodec);
		} catch (encodeError) {
			Logger.warn('uws', 'encode error', encodeError);
			return false;
		}
		this.#ws.send(frame);
		return true;
	}
	#startHeartbeat() {
		this.#stopHeartbeat();
		if (!this.heartbeatMs) {
			return;
		}
		this.#heartbeatTimer = setInterval(() => {
			this.#sendEnvelope({
				type: FRAME_TYPE.PING,
			});
		}, this.heartbeatMs);
	}
	#stopHeartbeat() {
		if (this.#heartbeatTimer) {
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}
	}
	#resolveOpen() {
		if (this.#openResolve) {
			this.#openResolve(this);
			this.#openResolve = null;
			this.#openReject = null;
		}
	}
	#rejectOpen(reason) {
		if (this.#openReject) {
			this.#openReject(new Error(reason));
			this.#openResolve = null;
			this.#openReject = null;
		}
	}
	#rejectAllPending(reason) {
		const error = new Error(reason);
		for (const waiter of this.#pending.values()) {
			clearTimeout(waiter.timer);
			waiter.reject(error);
		}
		this.#pending.clear();
	}
	#onClose() {
		this.#stopHeartbeat();
		this.#ws = null;
		/* Reject in-flight asks rather than silently stranding them — a hung wallet
		 * request must surface, and a retry is the caller's explicit decision. */
		this.#rejectAllPending('UniversalWebSocket: connection closed');
		if (!this.#alive || !this.shouldReconnect) {
			this.#rejectOpen('UniversalWebSocket: closed before connect');
			return;
		}
		this.#scheduleReconnect();
	}
	#scheduleReconnect() {
		clearTimeout(this.#reconnectTimer);
		this.#reconnectTimer = setTimeout(() => {
			this.#connect();
		}, this.#reconnectDelay);
		this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, this.maxReconnectMs);
	}
	/** Permanently close the socket and reject any in-flight requests. */
	close() {
		this.#alive = false;
		clearTimeout(this.#reconnectTimer);
		this.#reconnectTimer = null;
		this.#stopHeartbeat();
		this.#rejectOpen('UniversalWebSocket: closed by caller');
		this.#rejectAllPending('UniversalWebSocket: closed by caller');
		if (this.#ws) {
			this.#ws.close();
			this.#ws = null;
		}
	}
}
