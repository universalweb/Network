import { assign } from '@universalweb/acid';
export class SignatureScheme {
	constructor(config = {}) {
		assign(this, config);
		return this;
	}
	async keygen() {
		const keypair = await this.createKeypair();
		return keypair;
	}
	async signatureKeypair(target) {
		const keypair = await this.keygen();
		if (target) {
			if (target.publicKey) {
				target.publicKey = keypair.publicKey;
			}
			if (target.privateKey) {
				target.privateKey = keypair.privateKey;
			}
			return target;
		}
		return keypair;
	}
	async getSignature(source) {
		return source && source.subarray(0, this.signatureSize);
	}
	async getSignedData(source) {
		return source && source.subarray(this.signatureSize);
	}
	async sign(message, privateKey) {
		if (!message || !privateKey) {
			return false;
		}
		const signature = await this.signMethod(message, privateKey?.privateKey || privateKey);
		if (!signature) {
			return false;
		}
		return signature;
	}
	async hashSign(message, privateKey) {
		const hash = await this.hash(message);
		return this.sign(hash, privateKey);
	}
	async hash512Sign(message, privateKey) {
		const hash = await this.hash512(message);
		return this.sign(hash, privateKey);
	}
	async signCombined(message, privateKey) {
		if (!message || !privateKey) {
			return false;
		}
		const signature = await this.sign(message, privateKey?.privateKey || privateKey);
		if (!signature) {
			return false;
		}
		return Buffer.concat([signature, message]);
	}
	async verifySignature(signature, publicKey, message) {
		if (!signature || !publicKey || !message) {
			return false;
		}
		if (signature.length !== this.signatureSize) {
			return false;
		}
		const verification = await this.verifyMethod(signature, message, publicKey?.publicKey || publicKey);
		return verification;
	}
	async verify(signature, publicKey, message) {
		return this.verifySignature(signature, publicKey, message);
	}
	async verifySignatureCombined(signedMessage, publicKey) {
		if (!signedMessage || !publicKey) {
			return false;
		}
		const message = this.getSignedData(signedMessage);
		const signature = this.getSignature(signedMessage);
		const verification = await this.verifySignature(signature, message, publicKey?.publicKey || publicKey);
		return verification && message;
	}
}
export function signatureScheme(...args) {
	return new SignatureScheme(...args);
}
