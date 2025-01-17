// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clear, isBuffer } from '@universalweb/acid';
import {
	clientSetSession,
	encryptionKeypair as encryptionKeypair25519,
	get25519KeyCopy,
	getX25519Key,
	serverSetSession,
	serverSetSessionAttach,
} from '../keyExchange/x25519.js';
import { decapsulate, encapsulate } from '../keyExchange/kyber768.js';
import { decrypt, encrypt, encryptionOverhead } from '../encryption/XChaCha.js';
import { kyber768Half_x25519 } from '../keyExchange/kyber768Half_x25519.js';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeysSHAKE256,
	clearBuffers,
	clearBuffer,
	clearSessionKeys,
	clearSessionWithSharedSecret,
} = defaultCrypto;
const {
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	hash,
	getKyberKey
} = kyber768Half_x25519;
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqthalf',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and SHAKE256 but certification verification only occurs with x25519.',
	id: 1,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
	},
	clientEphemeralKeypair,
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
		const newTransmitKey = combineKeysSHAKE256(oldTransmitKey, sourceKeypair25519.transmitKey, sharedSecret);
		const newReceiveKey = combineKeysSHAKE256(oldReceiveKey, sourceKeypair25519.receiveKey, sharedSecret);
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
		source.nextSession = await kyber768Half_x25519.serverEphemeralKeypair(source, destination, cipherData);
		clearBuffer(cipherData);
		console.log('nextSession', source.nextSession);
	},
	async sendServerIntro(source, destination, frame, header) {
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
		const newTransmitKey = combineKeysSHAKE256(oldTransmitKey, x25519SessionKeys.transmitKey, sharedSecret);
		const newReceiveKey = combineKeysSHAKE256(oldReceiveKey, x25519SessionKeys.receiveKey, sharedSecret);
		await clearSessionWithSharedSecret(nextSessionKeypair25519);
		clearBuffers(oldSharedSecret, sharedSecret, destination.publicKey);
		source.transmitKey = newTransmitKey;
		source.receiveKey = newReceiveKey;
		console.log('sharedSecret', sharedSecret[0]);
		source.sharedSecret = null;
		source.nextSession = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	generateSeed,
	keypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	hash,
	decrypt,
	encrypt,
	encryptionOverhead
};
// copyright © Thomas Marchi
