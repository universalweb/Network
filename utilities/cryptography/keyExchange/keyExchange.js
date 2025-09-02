import { assign, isBuffer } from '@universalweb/utilitylib';
import { clearBuffer, clearBuffers } from '#utilities/cryptography/utils';
import { sodium_memzero } from '#utilities/cryptography/sodium';
export class KeyExchange {
	constructor(config) {
		assign(this, config);
	}
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = await this.keyExchangeKeypair();
		return generatedKeypair;
	}
	async createClientSession(source, destination, target) {
		const sharedSecret = source.sharedSecret;
		const clientPublicKey = source?.publicKeyHash || source?.publicKey;
		const serverPublicKey = destination?.publicKeyHash || destination?.publicKey;
		source.logInfo('sharedSecret', sharedSecret);
		source.logInfo('clientPublicKey', clientPublicKey);
		source.logInfo('serverPublicKey', serverPublicKey);
		const sessionKeyHash = await this.hash.concatHash512(
			sharedSecret,
			clientPublicKey,
			serverPublicKey
		);
		clearBuffer(sharedSecret);
		source.sharedSecret = null;
		source.logInfo('Session Key Hash', sessionKeyHash);
		const transmitKey = sessionKeyHash.subarray(this.sessionKeySize);
		const receiveKey = sessionKeyHash.subarray(0, this.sessionKeySize);
		if (target) {
			target.sessionKeyHash = sessionKeyHash;
			target.receiveKey = receiveKey;
			target.transmitKey = transmitKey;
			return target;
		}
		return {
			sessionKeyHash,
			receiveKey,
			transmitKey,
		};
	}
	async serverEphemeralKeypair(destination) {
		const generatedKeypair = await this.keyExchangeKeypair();
		return generatedKeypair;
	}
	//  TODO: SET IF FOR COMBINE PRIOR TX AND RX KEYS
	async createServerSession(source, destination, target) {
		const sharedSecret = source.sharedSecret;
		const clientPublicKey = destination?.publicKeyHash || destination?.publicKey;
		const serverPublicKey = source?.publicKeyHash || source?.publicKey;
		const sessionKeyHash = await this.hash.concatHash512(
			sharedSecret,
			clientPublicKey,
			serverPublicKey
		);
		clearBuffer(sharedSecret);
		source.sharedSecret = null;
		const receiveKey = sessionKeyHash.subarray(this.sessionKeySize);
		const transmitKey = sessionKeyHash.subarray(0, this.sessionKeySize);
		if (target) {
			target.sessionKeyHash = sessionKeyHash;
			target.receiveKey = receiveKey;
			target.transmitKey = transmitKey;
			return target;
		}
		return {
			sessionKeyHash,
			receiveKey,
			transmitKey,
		};
	}
	async exportKeypair(source) {
		const target = {};
		if (source.privateKey) {
			target.privateKey = (source.privateKey.export) ? await source.privateKey.export() : source.privateKey;
			if (!isBuffer(target.privateKey)) {
				target.privateKey = Buffer.from(target.privateKey);
			}
		}
		if (source.publicKey) {
			target.publicKey = (source.publicKey.export) ? await source.publicKey.export() : source.publicKey;
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
		if (isBuffer(source)) {
			return source;
		}
		if (source.export) {
			return Buffer.from(source.export());
		}
		if (source?.publicKey?.export) {
			return Buffer.from(source.publicKey.export());
		}
		return source.publicKey;
	}
	// COMBINE SESSION KEYS
	async upgradeSessionKeys(source, destination) {
		source.logInfo('upgradeSessionKeys', source.sharedSecret);
		const sharedSecret = source.sharedSecret;
		const {
			sessionKeyHash: oldSessionKeyHash,
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey,
		} = source;
		source.logInfo(oldReceiveKey, oldTransmitKey);
		source.logInfo(sharedSecret);
		source.transmitKey = await this.hash.concatHash(sharedSecret, oldTransmitKey);
		source.receiveKey = await this.hash.concatHash(sharedSecret, oldReceiveKey);
		clearBuffer(oldSessionKeyHash);
		source.logInfo('Keys', source.transmitKey[0], source.receiveKey[0]);
	}
	// Clear sensitive data as soon as possible for security & memory
	async cleanup(source) {
		source.logInfo('old buffer key cleanup');
		if (source.cipherData) {
			clearBuffer(source.cipherData);
			source.cipherData = null;
		}
		if (source.sharedSecret) {
			clearBuffer(source.sharedSecret);
			source.sharedSecret = null;
		}
		if (source.publicKeyHash) {
			clearBuffer(source.publicKeyHash);
			source.publicKeyHash = null;
		}
		if (source.publicKeyBuffer) {
			clearBuffer(source.publicKeyBuffer);
			source.publicKeyBuffer = null;
		}
		if (source.sessionKeyHash) {
			clearBuffer(source.sessionKeyHash);
			source.sessionKeyHash = null;
		}
	}
	async clientCleanup(source) {
		if (source.publicKey) {
			clearBuffer(source.publicKey);
			source.publicKey = null;
		}
		if (source.privateKey) {
			clearBuffer(source.privateKey);
			source.privateKey = null;
		}
	}
	async serverCleanup(source) {
		if (source.publicKey) {
			source.publicKey = null;
		}
		if (source.privateKey) {
			source.privateKey = null;
		}
	}
	async serverCleanupKeyClass(source) {
		if (source.publicKey) {
			source.publicKey = null;
		}
		if (source.privateKey) {
			source.privateKey = null;
		}
	}
	async certificateKeyExchangeKeypair() {
		const keypair = await this.keyExchangeKeypair();
		return this?.exportKeypair(keypair) || keypair;
	}
	async initializeKeypair(source) {
		return assign({}, source);
	}
	async initializePublicKey(source) {
		return source?.publicKey || source;
	}
}
export function keyExchange(config) {
	return new KeyExchange(config);
}
export default keyExchange;
