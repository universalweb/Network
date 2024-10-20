// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import {
	clientSetSession,
	clientSetSessionAttach,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSession,
	serverSetSessionAttach,
} from './x25519.js';
import { decapsulate, encapsulate, encryptionKeypair } from './kyber768.js';
import { decrypt, encrypt } from './XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId, randomBuffer, toBase64, toHex
} = defaultCrypto;
function get25519Key(source) {
	return source.slice(0, 32);
}
function getKyberKey(source) {
	return source.slice(32);
}
export function blake3CombineKeys(key1, key2) {
	// console.log('Combine', key1, key2);
	return blake3(Buffer.concat([key1, key2]));
}
function clearSessionKeys(source) {
	clearBuffer(source.transmitKey);
	clearBuffer(source.receiveKey);
	source.transmitKey = null;
	source.receiveKey = null;
}
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3.',
	id: 1,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
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
		const source = await x25519_kyber768Half_xchacha20.keypair();
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
		const x25519Keypair = await encryptionKeypair25519();
		return x25519Keypair;
	},
	decrypt,
	encrypt,
};
// EXAMPLE
// const ogServer = await encryptionKeypair25519();
// const client = await x25519_kyber768Half_xchacha20.clientEphemeralKeypair();
// await x25519_kyber768Half_xchacha20.clientInitializeSession(client, ogServer);
// await x25519_kyber768Half_xchacha20.serverInitializeSession(ogServer, client);
// console.log('CLIENT INITIALIZED', client);
// console.log('OG SERVER', ogServer);
// const server = await x25519_kyber768Half_xchacha20.serverEphemeralKeypair({}, client);
// await x25519_kyber768Half_xchacha20.clientSetSession(client, server);
// await x25519_kyber768Half_xchacha20.serverSetSession(server, client);
// console.log(Buffer.compare(server.transmitKey, client.receiveKey) === 0);
// console.log('CLIENT', client);
// console.log('SERVER', server);
// // TRY AND KEEP ESTIMATED MAX BELOW 1280 (1232)
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + server.publicKey.length, 'KYBER-CIPHERTEXT-OVERHEAD', server.publicKey.length);
// console.log(await x25519_kyber768Half_xchacha20.keypair(), await x25519_kyber768Half_xchacha20.keypair());
