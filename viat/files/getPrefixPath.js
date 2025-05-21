import { toBase64, toBase64Url } from '#crypto/utils.js';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// GET 3 BYTE PATH CONVERT TO ENCODING
// GET 4-6 BYTE PATH CONVERT TO ENCODING
// RETURN FULL PATH
export function getPrefixPath(walletAddressBuffer, size = 3, endIndex) {
	const firstFolder = toBase64Url(walletAddressBuffer.slice(0, size));
	const secondFolder = toBase64Url(walletAddressBuffer.slice(size, endIndex || size + size));
	return path.join(firstFolder, secondFolder);
}
