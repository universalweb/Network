import {
	clearBuffer,
	clearBuffers,
	clearSessionWithSharedSecret,
	randomBuffer,
	toBase64,
	toHex
} from '#utilities/cryptography/utils';
import { get25519KeyCopy, getKyberKey, getX25519Key } from './kyber768_x25519.js';
import { assign } from '@universalweb/acid';
import hash from '../hash/shake256.js';
import kyber768 from './kyber768.js';
import x25519 from './x25519.js';
const {
	combineKeys,
	hash256
} = hash;
const {
	decapsulate,
	encapsulate,
	keyExchangeKeypair,
} = kyber768;
const {
	clientSetSession,
	clientSetSessionAttach,
	keyExchangeKeypair: encryptionKeypairX25519,
	serverSetSession,
	serverSetSessionAttach,
} = x25519;
const publicKeySize = x25519.publicKeySize + kyber768.publicKeySize;
const privateKeySize = x25519.privateKeySize + kyber768.privateKeySize;
async function keypair(kyberSeed) {
	const x25519Keypair = await encryptionKeypairX25519();
	const kyberKeypair = await keyExchangeKeypair(kyberSeed);
	const target = {
		publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
		privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
	};
	return target;
}
async function serverEphemeralKeypair(source = {}, destination, cipherData) {
	const kyberDestinationPublicKey = getKyberKey(cipherData);
	const {
		cipherText,
		sharedSecret
	} = await encapsulate(kyberDestinationPublicKey);
	const ephemeralKeypair = await encryptionKeypairX25519();
	const target = {
		publicKey: Buffer.concat([ephemeralKeypair.publicKey, cipherText]),
		privateKey: ephemeralKeypair.privateKey,
		sharedSecret
	};
	clearBuffer(ephemeralKeypair.publicKey);
	clearBuffer(cipherText);
	ephemeralKeypair.privateKey = null;
	ephemeralKeypair.publicKey = null;
	return target;
}
export const kyber768Half_x25519 = {
	name: 'kyber768Half_x25519',
	alias: 'kyber768Half_x25519',
	description: 'Crystals-Kyber768 Client only with X25519 and Blake3.',
	id: 2,
	preferred: true,
	speed: 0,
	security: 1,
	cipherSuiteCompatibility: {
		0: true,
		1: true,
		2: true,
		3: true
	},
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: x25519.publicKeySize,
	serverPrivateKeySize: x25519.privateKeySize,
	generateSeed() {
		return randomBuffer(64);
	},
	async clientEphemeralKeypair() {
		const source = await keypair();
		return source;
	},
	async clientInitializeSession(source, destination) {
		const sourceKeypair25519 = {
			publicKey: getX25519Key(source.publicKey),
			privateKey: getX25519Key(source.privateKey)
		};
		console.log('clientInitializeSession Destination', destination);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destination, source);
		console.log('Public Key from destination', toHex(destination.publicKey));
		return x25519SessionKeys;
	},
	async clientSetSession(source, destination, cipherData) {
		const sourceKeypair25519 = {
			publicKey: getX25519Key(source.publicKey),
			privateKey: getX25519Key(source.privateKey)
		};
		const {
			sharedSecret: oldSharedSecret,
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		destination.publicKey = getX25519Key(cipherData);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destination, sourceKeypair25519);
		const cipherText = getKyberKey(cipherData);
		const kyberPrivateKey = getKyberKey(source.privateKey);
		console.log(cipherText, kyberPrivateKey);
		const sharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		console.log('clientSetSession sharedSecret', sharedSecret[0], sharedSecret.length);
		const newTransmitKey = await combineKeys(oldTransmitKey, sourceKeypair25519.transmitKey, sharedSecret);
		const newReceiveKey = await combineKeys(oldReceiveKey, sourceKeypair25519.receiveKey, sharedSecret);
		clearBuffer(cipherData);
		await clearSessionWithSharedSecret(sourceKeypair25519);
		clearBuffers(oldSharedSecret, sharedSecret);
		source.transmitKey = newTransmitKey;
		source.receiveKey = newReceiveKey;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async serverInitializeSession(source, destination, cipherData) {
		console.log('serverInitializeSession CIPHER', toHex(cipherData));
		destination.publicKey = get25519KeyCopy(cipherData);
		await serverSetSessionAttach(source, destination);
		source.nextSession = await serverEphemeralKeypair(source, destination, cipherData);
		clearBuffer(cipherData);
		console.log('nextSession', source.nextSession);
	},
	async serverIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.nextSession.publicKey);
		frame[3] = source.nextSession.publicKey;
	},
	async serverSetSession(source, destination) {
		console.log('server Setting Session');
		const {
			nextSession,
			sharedSecret: oldSharedSecret,
			transmitKey: oldTransmitKey,
			receiveKey: oldReceiveKey
		} = source;
		const nextSessionKeypair25519 = {
			publicKey: getX25519Key(nextSession.publicKey),
			privateKey: getX25519Key(nextSession.privateKey)
		};
		console.log('serverSetSession nextSession', nextSessionKeypair25519, destination);
		const x25519SessionKeys = serverSetSession(nextSessionKeypair25519, destination, nextSessionKeypair25519);
		const sharedSecret = nextSession.sharedSecret;
		const newTransmitKey = await combineKeys(oldTransmitKey, x25519SessionKeys.transmitKey, sharedSecret);
		const newReceiveKey = await combineKeys(oldReceiveKey, x25519SessionKeys.receiveKey, sharedSecret);
		await clearSessionWithSharedSecret(nextSessionKeypair25519);
		clearBuffers(oldSharedSecret, sharedSecret, destination.publicKey);
		source.transmitKey = newTransmitKey;
		source.receiveKey = newReceiveKey;
		console.log('sharedSecret', sharedSecret[0]);
		source.sharedSecret = null;
		source.nextSession = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async certificateEncryptionKeypair() {
		const x25519Keypair = await encryptionKeypairX25519();
		return x25519Keypair;
	},
	hash: hash256,
	getKyberKey
};
export default kyber768Half_x25519;
