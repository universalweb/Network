export function u8ToBase64(u8) {
	if (!u8) {
		return '';
	}
	if (typeof u8 === 'string') {
		return u8;
	}
	// Use native Uint8Array.toBase64() if available (modern browsers)
	if (typeof u8.toBase64 === 'function') {
		return u8.toBase64();
	}
	// Fallback to String.fromCharCode.apply() for older browsers
	return btoa(new TextDecoder('latin1').decode(u8));
}
export function base64ToU8(value) {
	if (!value) {
		return new Uint8Array();
	}
	// Use native Uint8Array.fromBase64() if available (modern browsers/Node.js)
	if (typeof Uint8Array.fromBase64 === 'function') {
		return Uint8Array.fromBase64(value);
	}
	// Fallback to atob() with Uint8Array.from() for better performance
	const binary = atob(value);
	return Uint8Array.from(binary, (char) => {
		return char.charCodeAt(0);
	});
}
export function formatAmount(value) {
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value.toString() : '0';
	}
	if (!value) {
		return '0';
	}
	return String(value);
}
