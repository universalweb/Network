// CONVERT THIS TO SHAKE256 AFTER x25519_blake3 is done
// Consider SHAKE256 as the hash function for x25519_shake256 variant
import {
	clearBuffer,
	clearBuffers,
	int32,
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import { combineKeys, hash256 } from '../hash/shake256.js';
import {
	decapsulate,
	encapsulate,
	encryptionKeypair,
	kyber768
} from './kyber768.js';
import { assign } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import x25519 from './x25519.js';
const {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair: encryptionKeypairX25519,
	serverSetSession,
	serverSetSessionAttach,
} = x25519;
const publicKeySize = x25519.publicKeySize + kyber768.publicKeySize;
const privateKeySize = x25519.privateKeySize + kyber768.privateKeySize;
export function getKyberKey(source) {
	return source.subarray(32);
}
export function getX25519Key(source) {
	return source.subarray(0, int32);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, int32);
}
export function getX25519Keypair(source) {
	return {
		publicKey: getX25519Key(source.publicKey),
		privateKey: getX25519Key(source.privateKey)
	};
}
export const kyber768_x25519 = {
	name: 'kyber768_x25519',
	alias: 'kyber768_x25519',
	description: 'Crystals-Kyber768 with X25519 and SHAKE256.',
	id: 3,
	// partial initial encryption on first packet
	async clientInitializeSession(source, destination) {
		const sourceKeypair25519 = {
			publicKey: getX25519Key(source.publicKey),
			privateKey: getX25519Key(source.privateKey)
		};
		const destinationPublicKey = destination.publicKey;
		const destinationX25519PublicKey = getX25519Key(destinationPublicKey);
		console.log('clientInitializeSession Destination', destinationX25519PublicKey.length);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destinationPublicKey, source);
		console.log('Public Key from destination', toHex(destinationX25519PublicKey));
		return x25519SessionKeys;
	},
	async clientSetSession(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const sourceKeypair25519 = {
			publicKey: getX25519Key(source.publicKey),
			privateKey: getX25519Key(source.privateKey)
		};
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, getX25519Key(destinationPublicKey), source);
		const cipherText = getKyberKey(destinationPublicKey);
		const kyberPrivateKey = getKyberKey(source.privateKey);
		// console.log(cipherText, kyberPrivateKey);
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		console.log('clientSetSession kyberSharedSecret', kyberSharedSecret[0], kyberSharedSecret.length);
		source.transmitKey = await combineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret);
		source.receiveKey = await combineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret);
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async serverEphemeralKeypair(source = {}, destination) {
		const destinationPublicKey = destination.publicKey;
		const x25519Keypair = await encryptionKeypairX25519(source);
		const kyberPublicKeypair = getKyberKey(destinationPublicKey);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(kyberPublicKeypair);
		assign(source, x25519Keypair);
		source.publicKey = Buffer.concat([x25519Keypair.publicKey, cipherText]);
		source.sharedSecret = sharedSecret;
		console.log('client kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('client cipherText', cipherText[0], cipherText.length);
		return source;
	},
	async serverInitializeSession(source, destination) {
		console.log('serverInitializeSession');
		const x25519SessionKeys = serverSetSessionAttach(source, getX25519Key(destination?.publicKey || destination));
		console.log('Public Key from destination', toHex(destination.publicKey));
		return x25519SessionKeys;
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const destinationPublicKey = destination.publicKey;
		const sourceKeypair25519 = {
			publicKey: getX25519Key(source.publicKey),
			privateKey: getX25519Key(source.privateKey)
		};
		const x25519SessionKeys = serverSetSession(sourceKeypair25519, getX25519Key(destinationPublicKey), source);
		const sharedSecret = source.sharedSecret;
		const {
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		source.transmitKey = await combineKeys(oldTransmitKey, sharedSecret);
		source.receiveKey = await combineKeys(oldReceiveKey, sharedSecret);
		console.log('kyberSharedSecret', sharedSecret[0]);
		clearBuffer(sharedSecret);
		clearBuffer(oldTransmitKey);
		clearBuffer(oldReceiveKey);
		source.sharedSecret = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	generateSeed() {
		return randomBuffer(64);
	},
	async keypair(kyberSeed) {
		const x25519Keypair = await encryptionKeypairX25519();
		const kyberKeypair = await encryptionKeypair(kyberSeed);
		const target = {
			publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
		};
		return target;
	},
	async clientEphemeralKeypair() {
		const source = await kyber768_x25519.keypair();
		return source;
	},
	async certificateEncryptionKeypair() {
		const target = await kyber768_x25519.keypair();
		return target;
	},
	prepareKeypair(cert) {
		const sourceKeypair = cert.get('encryptionKeypair');
		if (sourceKeypair) {
			const {
				publicKey,
				privateKey
			} = sourceKeypair;
			if (publicKey) {
				cert.publicKeyX25519 = getX25519Key(publicKey);
			}
			if (privateKey) {
				cert.privateKeyX25519 = getX25519Key(privateKey);
			}
		}
	},
	hash: hash256,
	ml_kem768,
	noneQuatumPublicKeySize: x25519.publicKeySize,
	noneQuatumPrivateKeySize: x25519.privateKeySize,
	quantumPublicKeySize: kyber768.publicKeySize,
	quantumPrivateKeySize: kyber768.privateKeySize,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	cipherSuiteCompatibility: {
		recommended: 3,
		postQuantumRecommended: 3,
		lowestSupported: 0,
		maxSupported: 3,
		0: true,
		1: true,
		2: true,
		3: true
	},
	preferred: true,
	preferredPostQuantum: true,
	speed: 0,
	security: 1,
};
export default kyber768_x25519;
