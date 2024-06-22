const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_SESSIONKEYBYTES,
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
	crypto_aead_xchacha20poly1305_ietf_keygen,
	crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
} = sodiumLib;
import { bufferAlloc, randomize } from '../crypto.js';
export function emptyNonce() {
	return bufferAlloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
}
export function nonceBox(nonceBuffer) {
	if (nonceBuffer) {
		return randomize(nonceBuffer);
	}
	const nonce = randomize(emptyNonce());
	return nonce;
}
export function createSecretKey() {
	const secretKey = bufferAlloc(crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
	crypto_aead_xchacha20poly1305_ietf_keygen(secretKey);
	return secretKey;
}
export function createSessionKey() {
	const sessionKey = bufferAlloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
export function encrypt(message, sessionkeys, ad, nonceArg) {
	const encrypted = bufferAlloc(message.length + crypto_aead_xchacha20poly1305_ietf_ABYTES);
	const nonce = nonceBox(nonceArg);
	crypto_aead_xchacha20poly1305_ietf_encrypt(encrypted, message, ad, null, nonce, sessionkeys?.transmitKey || sessionkeys);
	return Buffer.concat([
		nonce,
		encrypted
	]);
}
encrypt.overhead = crypto_aead_xchacha20poly1305_ietf_ABYTES + crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
export function decrypt(encrypted, sessionkeys, ad, nonceArg) {
	try {
		const encryptedPayloadLength = encrypted.length;
		const nonce = nonceArg || encrypted.subarray(0, crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
		const encryptedMessage = (nonceArg && encrypted) || encrypted.subarray(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES, encryptedPayloadLength);
		const message = (nonceArg && encrypted) || bufferAlloc(encryptedMessage.length - crypto_aead_xchacha20poly1305_ietf_ABYTES);
		const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, encryptedMessage, ad, nonce, sessionkeys?.receiveKey || sessionkeys);
		if (verify) {
			return message;
		} else {
			return;
		}
	} catch (e) {
		return;
	}
}
