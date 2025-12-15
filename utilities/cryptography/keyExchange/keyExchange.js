import { assign, isBuffer } from '@universalweb/utilitylib';
import { clearBuffer } from '#utilities/cryptography/utils';
/*
	NOTE: Consider KMAC or cSHAKE for domain separation in session key generation instead of concact then SHA3-256
*/
export class KeyExchange {
	constructor(config) {
		assign(this, config);
	}
	async clientEphemeralKeypair(destination) {
		const generatedKeypair = await this.keyExchangeKeypair();
		return generatedKeypair;
	}
	// NOTE: Consider CBOR or Domain Separation for session key generation
	async createClientSession(client, server, target) {
		const sharedSecret = client.sharedSecret;
		const clientPublicKey = client?.publicKeyHash || client?.publicKey;
		const serverPublicKey = server?.publicKeyHash || server?.publicKey;
		client.logInfo('sharedSecret', sharedSecret);
		client.logInfo('clientPublicKey', clientPublicKey);
		client.logInfo('serverPublicKey', serverPublicKey);
		const sessionKeyHash = await this.hash.concatHash512(
			sharedSecret,
			clientPublicKey,
			serverPublicKey
		);
		clearBuffer(sharedSecret);
		client.sharedSecret = null;
		client.logInfo('Session Key Hash', sessionKeyHash);
		const transmitKey = sessionKeyHash.subarray(this.sessionKeySize);
		const receiveKey = sessionKeyHash.subarray(0, this.sessionKeySize);
		console.log('createServerSession', sessionKeyHash.length, receiveKey, transmitKey);
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
	async createServerSession(server, client, target) {
		const sharedSecret = server.sharedSecret;
		const clientPublicKey = client?.publicKeyHash || client?.publicKey;
		const serverPublicKey = server?.publicKeyHash || server?.publicKey;
		const sessionKeyHash = await this.hash.concatHash512(
			sharedSecret,
			clientPublicKey,
			serverPublicKey
		);
		clearBuffer(sharedSecret);
		server.sharedSecret = null;
		const receiveKey = sessionKeyHash.subarray(this.sessionKeySize);
		const transmitKey = sessionKeyHash.subarray(0, this.sessionKeySize);
		console.log('createServerSession', sessionKeyHash.length, receiveKey, transmitKey);
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
			// const privateKey = target.privateKey.subarray(0, this.privateKeySize);
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
		source.logInfo('upgradeSessionKeys', source.sharedSecret[0]);
		const sharedSecret = source.sharedSecret;
		const {
			sessionKeyHash: oldSessionKeyHash,
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey,
		} = source;
		console.log('sharedSecret', sharedSecret[0], 'Old Keys', oldTransmitKey[0], oldReceiveKey[0]);
		console.log('sharedSecret destination', 'Old Keys', destination.transmitKey[0], destination.receiveKey[0]);
		source.transmitKey = await this.hash.concatHashStrict(sharedSecret, oldTransmitKey);
		source.receiveKey = await this.hash.concatHashStrict(sharedSecret, oldReceiveKey);
		console.log('sharedSecret', sharedSecret[0], 'Old Keys', source.transmitKey[0], source.receiveKey[0]);
		// NOTE: CONFIRM WONT CAUSE ISSUES WITH OLDER CODEBASE
		clearBuffer(sharedSecret);
		source.sharedSecret = null;
		clearBuffer(oldSessionKeyHash);
		source.sessionKeyHash = null;
		console.log('New Keys', source.transmitKey[0], source.receiveKey[0]);
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
		if (this?.exportKeypair) {
			return this?.exportKeypair(keypair);
		}
		return keypair;
	}
	async initializeKeypair(source) {
		return assign({}, source);
	}
	async initializePublicKey(source) {
		return source?.publicKey || source;
	}
	compareSessionkeys(client, server) {
		if (!client.receiveKey || !client.transmitKey) {
			return false;
		}
		if (!server.receiveKey || !server.transmitKey) {
			return false;
		}
		if (client.receiveKey.length !== server.transmitKey.length) {
			return false;
		}
		if (client.transmitKey.length !== server.receiveKey.length) {
			return false;
		}
		const receiveKeyMatch = client.receiveKey.equals(server.transmitKey);
		const transmitKeyMatch = client.transmitKey.equals(server.receiveKey);
		if (receiveKeyMatch && transmitKeyMatch) {
			return true;
		}
		return false;
	}
	compareSessionkeysThrow(client, server) {
		console.log('compareSessionkeysThrow START');
		if (!client.receiveKey || !client.transmitKey) {
			throw new Error('incomplete client keys');
		}
		if (!server.receiveKey || !server.transmitKey) {
			throw new Error('incomplete server keys');
		}
		if (client.receiveKey.length !== server.transmitKey.length) {
			throw new Error('mismatched key sizes');
		}
		if (client.transmitKey.length !== server.receiveKey.length) {
			throw new Error('mismatched key sizes');
		}
		const receiveKeyMatch = client.receiveKey.equals(server.transmitKey);
		const transmitKeyMatch = client.transmitKey.equals(server.receiveKey);
		console.log('Session keys', {
			clientSessionKeyHash: client.sessionKeyHash,
			serverSessionKeyHash: server.sessionKeyHash,
			receiveKeys: {
				client: client.receiveKey,
				server: server.receiveKey,
				equal: receiveKeyMatch,
			},
			transmitKeys: {
				client: client.transmitKey,
				server: server.transmitKey,
				equal: transmitKeyMatch,
			},
		});
		if (receiveKeyMatch && transmitKeyMatch) {
			return 'Keys Match';
		}
		if (receiveKeyMatch !== transmitKeyMatch) {
			throw new Error('only one key matches');
		}
		throw new Error('session keys do not match');
	}
}
export function keyExchange(config) {
	return new KeyExchange(config);
}
export default keyExchange;
