// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/utilitylib';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { encapsulate } from '../keyExchange/kyber768.js';
import { extendedHandshakeRPC } from '../../protocolFrameRPCs.js';
import { kyber768_x25519 } from '../keyExchange/kyber768_x25519.js';
const hash = blake3;
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	combineKeys,
	getX25519Key,
	getKyberKey
} = defaultCrypto;
const {
	clientInitializeSession,
	serverInitializeSession,
	serverSetSession,
	clientSetSession,
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	noneQuatumPublicKeySize,
	noneQuatumPrivateKeySize,
	quantumPublicKeySize,
	quantumPrivateKeySize,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize,
	clientPrivateKeySize,
	serverPublicKeySize,
	serverPrivateKeySize,
	getX25519Keypair
} = kyber768_x25519;
export const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3.',
	id: 3,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	async clientEphemeralKeypair() {
		const source = await keypair();
		return source;
	},
	async clientInitializeSession(source, destination) {
		const sourceKeypair25519 = getX25519Keypair(source);
		console.log('clientInitializeSession Destination', destination);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destination, source);
		console.log('Public Key from destination', toHex(destination.publicKey));
		return x25519SessionKeys;
	},
	async sendClientExtendedHandshake(source, destination) {
		const destinationPublicKey = destination.publicKey;
		console.log('TRIGGERED sendClientExtendedHandshake');
		console.log(destinationPublicKey.length);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		const frame = [
			false,
			extendedHandshakeRPC,
			cipherText
		];
		source.cipherData = cipherText;
		source.sharedSecret = sharedSecret;
		console.log('sendClientExtendedHandshake kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('sendClientExtendedHandshake cipherText', cipherText[0], cipherText.length);
		return frame;
	},
	async certificateEncryptionKeypair() {
		const target = await keypair();
		return target;
	},
	keypair,
	noneQuatumPublicKeySize,
	noneQuatumPrivateKeySize,
	quantumPublicKeySize,
	quantumPrivateKeySize,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize,
	clientPrivateKeySize,
	serverPublicKeySize,
	serverPrivateKeySize,
	hash,
	encrypt,
	decrypt,
};

