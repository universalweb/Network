/*
	encrypt x 627,141 ops/sec ±0.51% (98 runs sampled)
	decrypt x 1,591,260- ops/sec ±1.16% (98 runs sampled)
*/
import { bufferAlloc, int32, randomize } from '#utilities/cryptography/utils';
import {
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_keygen
} from '#utilities/cryptography/sodium';
import cipher from './cipher.js';
// import Benchmark from 'benchmark';
const sessionKeySize = int32;
const secretKeySize = sessionKeySize;
const nonceSize = 24;
const additionalBytesSize = crypto_aead_xchacha20poly1305_ietf_ABYTES;
const overhead = additionalBytesSize + nonceSize;
async function keygen() {
	const secretKey = bufferAlloc(secretKeySize);
	crypto_aead_xchacha20poly1305_ietf_keygen(secretKey);
	return secretKey;
}
async function encryptMethod(message, sessionkeys, ad, nonceArg) {
	const encrypted = bufferAlloc(message.length + additionalBytesSize);
	const nonce = (nonceArg) ? randomize(nonceArg) : await this.createNonce();
	crypto_aead_xchacha20poly1305_ietf_encrypt(encrypted, message, ad, null, nonce, sessionkeys?.transmitKey || sessionkeys);
	return Buffer.concat([
		nonce,
		encrypted
	]);
}
async function decryptMethod(encryptedData, sessionKey, ad, nonceArg) {
	const encrypted = (nonceArg) ? encryptedData : encryptedData.subarray(nonceSize);
	const nonce = (nonceArg) ? nonceArg : encryptedData.subarray(0, nonceSize);
	const message = bufferAlloc(encrypted.length - additionalBytesSize);
	const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, encrypted, ad, nonce, sessionKey?.receiveKey || sessionKey);
	if (verify) {
		return message;
	} else {
		return;
	}
}
export const xChaCha = cipher({
	id: 0,
	name: 'xchacha20poly1305',
	alias: 'default',
	sessionKeySize,
	secretKeySize,
	nonceSize,
	overhead,
	additionalBytesSize,
	encryptMethod,
	decryptMethod,
});
export default xChaCha;
// const n = randomize(bufferAlloc(nonceSize));
// const msg = Buffer.from('test');
// const add = Buffer.from('dd');
// const key = await keygen();
// const encr = await encryptMethod(msg, key, add, n);
// console.log(encr, encr.length);
// const dec = await decryptMethod(encr, key, add);
// console.log((dec).toString('utf-8'));
