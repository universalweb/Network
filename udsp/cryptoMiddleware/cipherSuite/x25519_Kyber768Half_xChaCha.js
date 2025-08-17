// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import {
	clientSetSession,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSession,
	serverSetSessionAttach
} from '../keyExchange/x25519.js';
import { decapsulate, encapsulate } from '../keyExchange/kyber768.js';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { kyber768Half_x25519 } from '../keyExchange/kyber768Half_x25519.js';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	combineKeys,
	getX25519Key,
	getKyberKey,
	get2519KeyCopy
} = defaultCrypto;
const {
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	hash
} = kyber768Half_x25519;
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqthalf',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3 but certification verification only occurs with x25519.',
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
		destination.publicKey = get2519KeyCopy(cipherData);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destination, source);
		const cipherText = getKyberKey(cipherData);
		const kyberPrivateKey = getKyberKey(source.privateKey);
		console.log(cipherText, kyberPrivateKey);
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		console.log('clientSetSession kyberSharedSecret', kyberSharedSecret[0], kyberSharedSecret.length);
		source.transmitKey = combineKeys(source.transmitKey, kyberSharedSecret);
		source.receiveKey = combineKeys(source.receiveKey, kyberSharedSecret);
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async serverInitializeSession(source, destination, cipherData) {
		console.log('serverInitializeSession CIPHER', toHex(cipherData));
		destination.publicKey = get2519KeyCopy(cipherData);
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
		console.log('serverSetSession');
		if (source.nextSession) {
			assign(source, source.nextSession);
			source.nextSession = null;
			const sourceKeypair25519 = {
				publicKey: getX25519Key(source.publicKey),
				privateKey: getX25519Key(source.privateKey)
			};
			console.log('serverSetSession nextSession', sourceKeypair25519, destination);
			const x25519SessionKeys = serverSetSession(sourceKeypair25519, destination, source);
			const sharedSecret = source.sharedSecret;
			source.transmitKey = combineKeys(source.transmitKey, sharedSecret);
			source.receiveKey = combineKeys(source.receiveKey, sharedSecret);
			console.log('kyberSharedSecret', sharedSecret[0]);
			clearBuffer(sharedSecret);
			source.sharedSecret = null;
			console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
		}
	},
	generateSeed,
	keypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	hash,
	decrypt,
	encrypt,
};
