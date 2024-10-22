import * as defaultCrypto from '#crypto';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSession,
	serverSetSessionAttach
} from './x25519.js';
import { decapsulate, encapsulate } from '../keyExchange/kyber768.js';
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
	getKyberKey
} = defaultCrypto;
export const kyber768_x25519 = {
	name: 'kyber768_x25519',
	alias: 'kyber768_x25519',
	description: 'Crystals-Kyber768 with X25519 and Blake3.',
	id: 3,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		keyexchange: {
			0: true,
			1: true
		}
	},
	hash: blake3,
	async clientInitializeSession(source, destination) {
		const sourceKeypair25519 = {
			publicKey: get25519Key(source.publicKey),
			privateKey: get25519Key(source.privateKey)
		};
		console.log('clientInitializeSession Destination', destination);
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, destination, source);
		console.log('Public Key from destination', toHex(destination.publicKey));
		return x25519SessionKeys;
	},
	async serverInitializeSession(source, destination) {
		console.log('serverInitializeSession');
		const x25519SessionKeys = serverSetSessionAttach(source, get25519Key(destination?.publicKey || destination));
		console.log('Public Key from destination', toHex(destination.publicKey));
		return x25519SessionKeys;
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const destinationPublicKey = destination.publicKey;
		const sourceKeypair25519 = {
			publicKey: get25519Key(source.publicKey),
			privateKey: get25519Key(source.privateKey)
		};
		const x25519SessionKeys = serverSetSession(sourceKeypair25519, get25519Key(destinationPublicKey), source);
		const sharedSecret = source.sharedSecret;
		source.transmitKey = blake3CombineKeys(source.transmitKey, sharedSecret);
		source.receiveKey = blake3CombineKeys(source.receiveKey, sharedSecret);
		console.log('kyberSharedSecret', sharedSecret[0]);
		source.sharedSecret = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async clientSetSession(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const sourceKeypair25519 = {
			publicKey: get25519Key(source.publicKey),
			privateKey: get25519Key(source.privateKey)
		};
		const x25519SessionKeys = clientSetSession(sourceKeypair25519, get25519Key(destinationPublicKey), source);
		const cipherText = getKyberKey(destinationPublicKey);
		const kyberPrivateKey = getKyberKey(source.privateKey);
		console.log(cipherText, kyberPrivateKey);
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		console.log('clientSetSession kyberSharedSecret', kyberSharedSecret[0], kyberSharedSecret.length);
		source.transmitKey = blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret);
		source.receiveKey = blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret);
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
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
		const source = await kyber768_x25519.keypair();
		return source;
	},
	async serverEphemeralKeypair(source = {}, destination) {
		const destinationPublicKey = destination.publicKey;
		const x25519Keypair = await encryptionKeypair25519(source);
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
	async certificateEncryptionKeypair() {
		const source = await kyber768_x25519.keypair();
		return source;
	},
};
