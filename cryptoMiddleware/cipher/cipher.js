import {
	bufferAlloc,
	concatBuffer,
	int32,
	randomize
} from '#crypto';
import { assign } from '@universalweb/acid';
// DEFAULT SIZES
export const sessionKeySize = int32;
export const secretKeySize = sessionKeySize;
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
			const encrypted = this.encryptMethod(message, ad, nonce, sessionKey?.transmitKey || sessionKey);
			return Buffer.concat([
				nonce,
				encrypted
			]);
		} catch (e) {
			return;
		}
	}
	async decrypt(encrypted, sessionkey, ad, nonceArg) {
		try {
			const encryptedPayloadLength = encrypted.length;
			const nonce = nonceArg || encrypted.subarray(0, this.nonceSize);
			const encryptedMessage = (nonceArg && encrypted) || encrypted.subarray(this.nonceSize, encryptedPayloadLength);
			const message = this.decryptMethod(encryptedMessage, ad, nonce, sessionkey?.receiveKey || sessionkey);
			return message;
		} catch (e) {
			return;
		}
	}
	sessionKeySize = sessionKeySize;
	secretKeySize = secretKeySize;
}
export function cipher(options) {
	return new Cipher(options);
}
export default cipher;
