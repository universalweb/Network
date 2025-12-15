import { isBuffer, isU8 } from '@universalweb/utilitylib';
import { cshake256 } from '@noble/hashes/sha3-addons.js';
import { int32 } from '#crypto/utils.js';
// Note: unused randomBuffer import removed
const cshake256Name = 'cSHAKE256';
// Environment checks - use addon's pure-JS implementation in Bun or browsers
const isBun = typeof globalThis.Bun !== 'undefined' && Boolean(globalThis.Bun);
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const useAddon = isBun || isBrowser;
const customizationEmpty = new Uint8Array();
const functionNameEmpty = new Uint8Array();
const { subtle } = globalThis.crypto;
export function cSHAKE256(buffer, outputSize = int32) {
	if (useAddon) {
		const inputU8 = buffer;
		const outputBytes = outputSize;
		const digest = cshake256(inputU8, {
			dkLen: outputBytes,
			personalization: customizationEmpty,
			NISTfn: functionNameEmpty,
		});
		return digest;
	}
	const webCryptoParams = {
		name: cshake256Name,
		length: outputSize * 8,
		customization: customizationEmpty,
		functionName: functionNameEmpty,
	};
	return subtle.digest(webCryptoParams, buffer);
}
// Export a single cSHAKE function (defaults to the 256 variant behavior)
async function example() {
	const paramDigest = await cSHAKE256(Buffer.from('paramDigest'));
	console.log(paramDigest);
	return paramDigest;
}
example();
