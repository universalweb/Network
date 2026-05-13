import { isString } from '@universalweb/utilitylib';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export function ensureBase64(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source).toString('base64');
}
export function ensureBase64URL(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source).toString('base64url');
}
export function base64orBuffer(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source);
}
export function textToBuffer(source) {
	return textEncoder.encode(source);
}
export function toUint8Array(source) {
	if (source === undefined || source === null) {
		return new Uint8Array(0);
	}
	if (source instanceof Uint8Array) {
		return new Uint8Array(source);
	}
	if (source instanceof ArrayBuffer) {
		return new Uint8Array(source);
	}
	if (ArrayBuffer.isView(source)) {
		return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	}
	if (isString(source)) {
		return textToBuffer(source);
	}
	return new Uint8Array(Buffer.from(source));
}
export function toBuffer(source) {
	return Buffer.from(toUint8Array(source));
}
export function toBase64(source) {
	return Buffer.from(toUint8Array(source)).toString('base64');
}
export function fromBase64(source) {
	return new Uint8Array(Buffer.from(source, 'base64'));
}
export function decodeText(source) {
	return textDecoder.decode(toUint8Array(source));
}
export function isBlobLike(source) {
	return typeof Blob !== 'undefined' && source instanceof Blob;
}
