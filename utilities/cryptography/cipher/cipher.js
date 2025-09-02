import {
	bufferAlloc,
	concatBuffer,
	int32,
	randomize,
} from '#crypto/utils.js';
import { assign } from '@universalweb/utilitylib';
// DEFAULT SIZES
export const sessionKeySize = int32;
export const secretKeySize = int32;
export class Cipher {
	constructor(options) {
		assign(this, options);
	}
	async emptyNonce() {
		return bufferAlloc(this.nonceSize);
	}
	async createNonce(nonceBuffer) {
		if (nonceBuffer) {
			return randomize(nonceBuffer);
		}
		const nonce = await randomize(await this.emptyNonce());
		return nonce;
	}
	async createSecretKey() {
		return this.keygen();
	}
	async sessionKeyBuffer() {
		const sessionKey = bufferAlloc(this.sessionKeySize);
		return sessionKey;
	}
	async encrypt(message, sessionKey, ad, nonce) {
		try {
			const encrypted = await this.encryptMethod(message, sessionKey?.transmitKey || sessionKey, ad, nonce);
			return encrypted;
		} catch (e) {
			return;
		}
	}
	async decrypt(encrypted, sessionkey, ad, nonceArg) {
		try {
			const encryptedPayloadLength = encrypted.length;
			const nonce = nonceArg || encrypted.subarray(0, this.nonceSize);
			const encryptedMessage = (nonceArg && encrypted) || encrypted.subarray(this.nonceSize, encryptedPayloadLength);
			const message = await this.decryptMethod(encryptedMessage, sessionkey?.receiveKey || sessionkey, ad, nonce);
			return message;
		} catch (e) {
			return;
		}
	}
	sessionKeySize = sessionKeySize;
	secretKeySize = secretKeySize;
	keySize = secretKeySize;
}
export function cipher(options) {
	return new Cipher(options);
}
export default cipher;
