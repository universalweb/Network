/*
 * UniversalWebSocket wire envelope — one logical message shape, two encodings.
 * JSON mode is zero-dependency and always available (the dev-friendly default that
 * works in the unbundled dev core). CBOR (binary) mode uses a codec the caller
 * INJECTS — `{ encode, decode }`, e.g. cbor-x — so the UWC core stays zero-external
 * (no node_modules dep) and isn't wired to one CBOR library; the VIAT SDK, which
 * already bundles cbor-x, supplies it. The server is adaptive: it replies in whatever
 * encoding the client's frames arrive in (binary → CBOR, text → JSON), negotiating by
 * example, not handshake.
 * Envelope: { type, id, method, data, error } — `type` see FRAME_TYPE; `id`
 * correlation (ASK/REPLY/ERROR); `method` route name (ASK/NOTIFY); `data` params
 * (ASK/NOTIFY) or result (REPLY); `error` { code, message } (ERROR only).
 */
export const FRAME_TYPE = Object.freeze({
	ASK: 'ask',
	REPLY: 'reply',
	ERROR: 'error',
	NOTIFY: 'notify',
	PING: 'ping',
	PONG: 'pong',
});
/**
 * Serialize an envelope for the wire. JSON mode returns a string (text frame); CBOR
 * mode returns a Uint8Array (binary frame) via the injected codec.
 * @param {object} envelope - The message envelope.
 * @param {string} mode - 'json' | 'cbor'.
 * @param {{encode: Function}|null} cborCodec - Injected codec (required for cbor mode).
 * @returns {string|Uint8Array} The encoded frame, ready for WebSocket.send.
 */
export function encodeFrame(envelope, mode, cborCodec) {
	if (mode === 'cbor') {
		if (!cborCodec) {
			throw new Error('UniversalWebSocket: CBOR mode requires an injected codec');
		}
		return cborCodec.encode(envelope);
	}
	return JSON.stringify(envelope);
}
/**
 * Parse a wire frame back into an envelope. Binary frames decode as CBOR, text frames
 * as JSON — independent of send mode, so one engine can answer a JSON client and a
 * CBOR client concurrently.
 * @param {string|ArrayBuffer|Uint8Array} raw - The frame payload.
 * @param {boolean} isBinary - Whether the frame arrived as a binary message.
 * @param {{decode: Function}|null} cborCodec - Injected codec (required for binary frames).
 * @returns {object} The decoded envelope.
 */
export function decodeFrame(raw, isBinary, cborCodec) {
	if (isBinary) {
		if (!cborCodec) {
			throw new Error('UniversalWebSocket: binary frame received without a CBOR codec');
		}
		const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
		return cborCodec.decode(bytes);
	}
	return JSON.parse(raw);
}
