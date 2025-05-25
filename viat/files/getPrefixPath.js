import { toBase64, toBase64Url } from '#crypto/utils.js';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// GET 3 BYTE PATH CONVERT TO ENCODING
// GET 4-6 BYTE PATH CONVERT TO ENCODING
// RETURN FULL PATH
export function getPrefixPath(sourceBuffer, size = 3, endIndex) {
	const firstFolder = toBase64Url(sourceBuffer.slice(0, size));
	const secondFolder = toBase64Url(sourceBuffer.slice(size, endIndex || size + size));
	return path.join(firstFolder, secondFolder);
}
export function getShortPrefixPath(sourceBuffer) {
	return getPrefixPath(sourceBuffer, 1, 2);
}
export function getFinalDirectory(sourceBuffer) {
	const address = toBase64Url(sourceBuffer.slice(40));
	return address;
}
