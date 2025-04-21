import { assign, isBuffer } from '@universalweb/acid';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { concatBuffer } from '#utilities/cryptography/utils';
export class SignatureScheme {
	constructor(config = {}) {
		assign(this, config);
		return this;
	}
	async signatureKeypair(target) {
		const keypair = await this.createKeypair();
		if (target) {
			assign(target, keypair);
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
	async openMethod(signedMessage, publicKey) {
		const verified = await ((publicKey?.publicKey || publicKey).open(signedMessage));
		return verified;
	}
	async openSignature(signature, publicKey) {
		if (!signature || !publicKey) {
			return false;
		}
		if (signature.length !== this.signatureSize) {
			return false;
		}
		try {
			const verification = await this.verifyMethod(signature, publicKey?.publicKey || publicKey);
			return verification;
		} catch {
			return false;
		}
	}
	async signMethod(message, source, ...args) {
		const signature = await ((source?.privateKey || source).sign(message));
		if (signature) {
			// console.log(signature);
			return Buffer.from(signature);
		}
		return false;
	}
	async sign(message, source, ...args) {
		if (!message || !source) {
			return false;
		}
		try {
			// console.log('SIGN', source);
			const signature = await this.signMethod(message, source, ...args);
			if (!signature) {
				return false;
			}
			return signature;
		} catch {
			return false;
		}
	}
	async signCombined(message, privateKey) {
		if (!message || !privateKey) {
			return false;
		}
		if (this.signCombinedMethod) {
			try {
				return this.signCombinedMethod(message, privateKey) || false;
			} catch {
				return false;
			}
		}
		try {
			const signature = await this.signMethod(message, privateKey?.privateKey || privateKey);
			if (!signature) {
				return false;
			}
			return Buffer.concat([signature, message]);
		} catch {
			return false;
		}
	}
	async hashSign(message, privateKey) {
		const hash = await this.hash(message);
		return this.sign(hash, privateKey);
	}
	async hash512Sign(message, privateKey) {
		const hash = await this.hash512(message);
		return this.sign(hash, privateKey);
	}
	async verifyMethod(signature, message, source) {
		const verified = await ((source?.publicKey || source).verify(message, signature));
		return verified;
	}
	async verifySignature(signature, message, publicKey) {
		if (!signature || !publicKey || !message) {
			return false;
		}
		// if (signature.length !== this.signatureSize) {
		// 	return false;
		// }
		try {
			const verification = await this.verifyMethod(signature, message, publicKey);
			return verification;
		} catch {
			return false;
		}
	}
	async verify(signature, message, publicKey) {
		return this.verifySignature(signature, message, publicKey);
	}
	async verifySignatureCombined(signedMessage, publicKey) {
		if (!signedMessage || !publicKey) {
			return false;
		}
		if (this.verifySignatureCombinedMethod) {
			return this.verifySignatureCombinedMethod(signedMessage, publicKey);
		}
		const message = this.getSignedData(signedMessage);
		const signature = this.getSignature(signedMessage);
		const verification = await this.verifySignature(signature, message, publicKey?.publicKey || publicKey);
		return verification && message;
	}
	async exportKeypair(source) {
		const target = {};
		if (source.privateKey) {
			target.privateKey = (source.privateKey.export) ? source.privateKey.export() : source.privateKey;
			if (!isBuffer(target.privateKey)) {
				target.privateKey = Buffer.from(target.privateKey);
			}
		}
		if (source.publicKey) {
			target.publicKey = (source.publicKey.export) ? source.publicKey.export() : source.publicKey;
			if (!isBuffer(target.publicKey)) {
				target.publicKey = Buffer.from(target.publicKey);
			}
		}
		if (target.privateKey.length === this.combinedKeySize) {
			const privateKey = target.privateKey.subarray(0, this.privateKeySize);
			if (!target.publicKey) {
				target.publicKey = target.publicKey.subarray(this.privateKeySize);
			}
		}
		return target;
	}
	async getPublicKey(source) {
		if (!source.publicKey) {
			return;
		}
		if (source.publicKey.export) {
			return Buffer.from(source.publicKey.export());
		}
		return source.publicKey;
	}
	async exportCombinedKey(source) {
		if (source.privateKey.length !== this.combinedKeySize) {
			return concatBuffer([source.privateKey, source.publicKey]);
		}
		return source.privateKey;
	}
	async initializeKeypair(source) {
		return assign({}, source);
	}
	async exportBinary(source) {
		const target = await this.exportKeypair(source);
		const targetArray = [target.publicKey];
		if (target.privateKey) {
			targetArray[1] = target.privateKey;
		}
		return encodeStrict(targetArray);
	}
	async initializeBinary(source) {
		const targetArray = decode(source);
		const target = {
			publicKey: targetArray[0],
			privateKey: targetArray[1]
		};
		// console.log('initializeBinary', target);
		return this.initializeKeypair(target);
	}
	async certificateSignatureKeypair() {
		const keypair = await this.signatureKeypair();
		return this?.exportKeypair(keypair) || keypair;
	}
	seedSize = 64;
}
export function signatureScheme(...args) {
	return new SignatureScheme(...args);
}
export default signatureScheme;
