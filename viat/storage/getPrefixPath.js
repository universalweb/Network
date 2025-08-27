import {
	base64ToBuffer,
	base64UrlToBuffer,
	hexToBuffer,
	toBase64,
	toBase64Url,
	toHex,
} from '#crypto/utils.js';
import path from 'path';
export function getPrefixPath(hash, size, depth, encode) {
	let endIndex = size;
	let target = encode(hash.subarray(0, size));
	if (depth > 1) {
		const level2 = encode(hash.subarray(size, endIndex += size));
		target = path.join(target, level2);
	}
	if (depth > 2) {
		const level3 = encode(hash.subarray(endIndex, endIndex + size));
		target = path.join(target, level3);
	}
	return target;
}
export function getFinalDirectory(hash, startIndex, endIndex, encode) {
	const address = encode(hash.subarray(startIndex, endIndex));
	return address;
}
export function getPrefixPathGenerator(size, depth, encode) {
	return (hash) => {
		if (hash) {
			return getPrefixPath(hash, size, depth, encode);
		}
	};
}
export function getFinalDirectoryGenerator(startIndex, endIndex, encode) {
	return (hash) => {
		if (hash) {
			return getFinalDirectory(hash, startIndex, endIndex, encode);
		}
	};
}
