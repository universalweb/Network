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
import { bufferAlloc, randomize } from '#utilities/crypto';
export const sessionKeySize = crypto_kx_SESSIONKEYBYTES;
export const secretKeySize = crypto_aead_xchacha20poly1305_ietf_KEYBYTES;
export const nonceSize = crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
export const additionalBytesSize = crypto_aead_xchacha20poly1305_ietf_ABYTES;
export const encryptionOverhead = additionalBytesSize + nonceSize;
export function emptyNonce() {
	return bufferAlloc(nonceSize);
}
export function createNonce(nonceBuffer) {
	if (nonceBuffer) {
		return randomize(nonceBuffer);
	}
	const nonce = randomize(emptyNonce());
	return nonce;
}
export function createSecretKey() {
	const secretKey = bufferAlloc(secretKeySize);
	crypto_aead_xchacha20poly1305_ietf_keygen(secretKey);
	return secretKey;
}
export function createSessionKey() {
	const sessionKey = bufferAlloc(sessionKeySize);
	return sessionKey;
}
export function encrypt(message, sessionkeys, ad, nonceArg) {
	const encrypted = bufferAlloc(message.length + additionalBytesSize);
	const nonce = createNonce(nonceArg);
	crypto_aead_xchacha20poly1305_ietf_encrypt(encrypted, message, ad, null, nonce, sessionkeys?.transmitKey || sessionkeys);
	return Buffer.concat([
		nonce,
		encrypted
	]);
}
export function decrypt(encrypted, sessionkeys, ad, nonceArg) {
	try {
		const encryptedPayloadLength = encrypted.length;
		const nonce = nonceArg || encrypted.subarray(0, nonceSize);
		const encryptedMessage = (nonceArg && encrypted) || encrypted.subarray(nonceSize, encryptedPayloadLength);
		const message = bufferAlloc(encryptedMessage.length - additionalBytesSize);
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
export const xchacha = {
	id: 0,
	name: 'xchacha',
	alias: 'default',
	sessionKeySize,
	secretKeySize,
	nonceSize,
	encryptionOverhead,
	additionalBytesSize,
	emptyNonce,
	createNonce,
	createSecretKey,
	createSessionKey,
	encrypt,
	decrypt
};
