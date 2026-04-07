import { isString } from '@universalweb/utilitylib';
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
	return new TextEncoder().encode(source);
}
