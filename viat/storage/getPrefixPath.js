import {
	base64ToBuffer,
	base64UrlToBuffer,
	hexToBuffer,
	toBase64,
	toBase64Url,
	toHex,
} from '#crypto/utils.js';
import { filesystemTypes } from './filesystem.js';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export function getPrefixPath(hash, config) {
	const {
		size,
		depth,
		encoding,
	} = config;
	let endIndex = size;
	const level1 = encoding.encode(hash.subarray(0, size));
	const level2 = encoding.encode(hash.subarray(size, endIndex += size));
	if (depth === 2) {
		return path.join(level1, level2);
	}
	if (depth === 3) {
		const level3 = encoding.encode(hash.subarray(endIndex, endIndex + size));
		return path.join(level1, level2, level3);
	}
}
export function getFinalDirectory(hash, config) {
	const {
		startIndex,
		encoding,
	} = config;
	const address = encoding.encode(hash.subarray(startIndex));
	return address;
}
const txBufferex = await viatCipherSuite.createBlockNonce(64);
console.log(getPrefixPath(txBufferex, filesystemTypes.generic.wallet.pathPrefix));
console.log(getFinalDirectory(txBufferex, filesystemTypes.generic.transaction.uniquePath).length);
// console.log(Buffer.from(getFinalDirectory(txBufferex), 'base64url'));
// console.log(toBase64(txBufferex.subarray(0, 7)));
