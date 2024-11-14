import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSession,
	serverSetSessionAttach
} from './x25519.js';
import { decapsulate, encapsulate, encryptionKeypair } from './kyber768.js';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { assign } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	blake3CombineKeys,
	get25519Key,
	getKyberKey,
	clearBuffer
} = defaultCrypto;
export const kyber768Half_x25519 = {
	name: 'kyber768Half_x25519',
	alias: 'kyber768Half_x25519',
	description: 'Crystals-Kyber768 Client only with X25519 and Blake3.',
	id: 2,
	ml_kem768,
	preferred: true,
	cipherSuites: [
		0,
		1
	],
	speed: 0,
	security: 1,
	compatibility: {
		keyexchange: {
			0: true,
		}
	},
	hash: blake3,
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
		return target;
	},
	async certificateEncryptionKeypair() {
		const x25519Keypair = await encryptionKeypair25519();
		return x25519Keypair;
	},
};
const keys = await kyber768Half_x25519.keypair();
const c = Buffer.copyBytesFrom(keys.publicKey, 0, 32);
console.log(c.length);
