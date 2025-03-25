/*
	encrypt x 371,588 ops/sec ±0.34% (97 runs sampled)
	decrypt x 581,631 ops/sec ±0.36% (98 runs sampled)
*/
import { bufferAlloc, int32, randomize } from '#utilities/cryptography/utils';
import Benchmark from 'benchmark';
import _sodium from 'libsodium-wrappers';
await _sodium.ready;
const {
	crypto_aead_aegis256_decrypt,
	crypto_aead_aegis256_encrypt,
	crypto_aead_xchacha20poly1305_ietf_keygen,
	crypto_aead_aegis256_keygen,
	crypto_aead_aegis256_ABYTES,
	crypto_aead_aegis256_KEYBYTES,
	crypto_aead_aegis256_MESSAGEBYTES_MAX,
	crypto_aead_aegis256_NPUBBYTES,
	crypto_aead_aegis256_NSECBYTES,
} = _sodium;
import cipher from './cipher.js';
export const sessionKeySize = crypto_aead_aegis256_KEYBYTES;
export const secretKeySize = crypto_aead_aegis256_KEYBYTES;
export const nonceSize = crypto_aead_aegis256_NPUBBYTES;
export const additionalBytesSize = crypto_aead_aegis256_ABYTES;
export const overhead = additionalBytesSize + nonceSize;
export async function keygen() {
	const secretKey = await crypto_aead_aegis256_keygen();
	return secretKey;
}
export async function encryptMethod(message, sessionkeys, ad, nonceArg) {
	const nonce = (nonceArg) ? randomize(nonceArg) : this.createNonce();
	const encrypted = crypto_aead_aegis256_encrypt(message, ad, null, nonce, sessionkeys?.transmitKey || sessionkeys, null);
	return Buffer.concat([
		nonce,
		encrypted
	]);
}
export async function decryptMethod(encryptedData, sessionKey, ad, nonceArg) {
	const encrypted = (nonceArg) ? encryptedData : encryptedData.subarray(nonceSize);
	const nonce = (nonceArg) ? nonceArg : encryptedData.subarray(0, nonceSize);
	const message = crypto_aead_aegis256_decrypt(null, encrypted, ad, nonce, sessionKey?.receiveKey || sessionKey);
	if (message) {
		return message;
	} else {
		return;
	}
}
export const aegis256 = cipher({
	id: 1,
	name: 'AEGIS-256',
	alias: 'aegis256',
	hardwareAccelerated: true,
	sessionKeySize,
	secretKeySize,
	nonceSize,
	overhead,
	additionalBytesSize,
	encryptMethod,
	decryptMethod,
});
export default aegis256;
// const n = randomize(bufferAlloc(nonceSize));
// const msg = Buffer.from('test');
// const add = Buffer.from('dd');
// const key = await keygen();
// const encr = await encryptMethod(msg, key, add, n);
// console.log(encr, encr.length);
// const dec = await decryptMethod(encr, key, add);
// console.log((dec).toString('utf-8'));
