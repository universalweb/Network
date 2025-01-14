import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSession,
	serverSetSessionAttach,
	x25519
} from './x25519.js';
import {
	decapsulate, encapsulate, encryptionKeypair, kyber768
} from './kyber768.js';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { assign } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeys,
	getX25519Key,
	clearBuffer
} = defaultCrypto;
const publicKeySize = x25519.publicKeySize + kyber768.publicKeySize;
const privateKeySize = x25519.privateKeySize + kyber768.privateKeySize;
export function getKyberKey(source) {
	return source.subarray(32);
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
	async keypair(kyberSeed) {
		const x25519Keypair = await encryptionKeypair25519();
		const kyberKeypair = await encryptionKeypair(kyberSeed);
		const target = {
			publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
		};
		return target;
	},
	async clientEphemeralKeypair() {
		const source = await kyber768Half_x25519.keypair();
		return source;
	},
	async serverEphemeralKeypair(source = {}, destination, cipherData) {
		const kyberDestinationPublicKey = getKyberKey(cipherData);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(kyberDestinationPublicKey);
		const ephemeralKeypair = await encryptionKeypair25519();
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
	},
	async certificateEncryptionKeypair() {
		const x25519Keypair = await encryptionKeypair25519();
		return x25519Keypair;
	},
	ml_kem768,
	hash: blake3,
	getKyberKey
};
export default kyber768Half_x25519;
