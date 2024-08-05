import * as defaultCrypto from '#crypto';
import { clearBuffer, isBuffer } from '@universalweb/acid';
import {
	clientSessionKeysAttach,
	encryptionKeypair as encryptionKeypair25519,
	serverSetSessionAttach,
	setClientSession,
} from './x25519.js';
import { decapsulate, encapsulate, encryptionKeypair } from './kyber768.js';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId, randomBuffer, toBase64
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
async function kyberDecapsulate(source, destination, x25519SessionKeys) {
	const sourceKeypairKyber = {
		privateKey: getKyberKey(source.privateKey),
		publicKey: getKyberKey(source.publicKey)
	};
	const cipherText = destination.preparedPublicKey.slice(32);
	console.log(cipherText, sourceKeypairKyber.privateKey);
	const kyberSharedSecret = await decapsulate(cipherText, sourceKeypairKyber.privateKey);
	console.log('server cipherText', cipherText, cipherText.length);
	source.transmitKey = blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret);
	source.receiveKey = blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret);
	clearSessionKeys(x25519SessionKeys);
}
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	// Hybrid Post Quantum Key Exchange
	alias: 'hpqt',
	id: 1,
	ml_kem768,
	preferred: true,
	hash: blake3,
	x25519ServerSessionKeys: serverSetSessionAttach,
	x25519ClientSessionKeys: clientSessionKeysAttach,
	kyberDecapsulate,
	async clientInitializeSession(source, destination) {
		const x25519SessionKeys = clientSessionKeysAttach(source, destination);
		console.log('PublicKey from Server', destination.publicKey);
		return x25519SessionKeys;
	},
	async serverInitializeSession(source, destination) {
		console.log('Session Keys are not set');
		const x25519SessionKeys = serverSetSessionAttach(source, destination?.publicKey.slice(0, 32));
		console.log('PublicKey from Server', destination.publicKey);
		return x25519SessionKeys;
	},
	async serverSetSession() {
		console.log('Session Keys are not set');
	},
	generateSeed() {
		return randomBuffer(64);
	},
	async keypair(seedArg) {
		const x25519Keypair = await encryptionKeypair25519();
		const seed = seedArg || x25519_kyber768Half_xchacha20.generateSeed();
		const kyberKeypair = await encryptionKeypair(seed);
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
		const x25519Keypair = await encryptionKeypair25519();
		const sourceKeypair25519 = x25519Keypair.publicKey;
		const x25519SessionKeys = serverSetSessionAttach(sourceKeypair25519, get25519Key(destinationPublicKey));
		const kyberPublicKeypair = getKyberKey(destinationPublicKey);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(kyberPublicKeypair);
		console.log('client kyberSharedSecret', sharedSecret);
		console.log('client cipherText', cipherText, cipherText.length);
		source.publicKey = Buffer.concat([sourceKeypair25519.publicKey, cipherText]);
		source.transmitKey = blake3CombineKeys(x25519SessionKeys.transmitKey, sharedSecret);
		source.receiveKey = blake3CombineKeys(x25519SessionKeys.receiveKey, sharedSecret);
		return source;
	},
	async certificateEncryptionKeypair() {
		const {
			x25519Keypair,
			kyberKeypair,
			publicKey
		} = x25519_kyber768Half_xchacha20.keypair();
		const target = {
			publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
		};
		return x25519_kyber768Half_xchacha20.keypair();
	},
	combineKeys: blake3CombineKeys
};
// const client = await x25519_kyber768Half_xchacha20.keypair();
// const server = await x25519_kyber768Half_xchacha20.ephemeralKeypair();
// await x25519_kyber768Half_xchacha20.setClientSession(client, server);
// console.log(client, server);
// console.log(client.publicKey.length);
// console.log(server.transmitKey);
// console.log(encrypt(boxSeal(randomBuffer(1120), keypair()), server.transmitKey).length);
// console.log('Client', clientSession.transmitKey);
// console.log('Server', serverSession.receiveKey);
// console.log(Buffer.compare(clientSession.transmitKey, serverSession.receiveKey));
// console.log(alice.kyberKeypair.publicKey.length);
// TRY AND KEEP ESTIMATED MAX BELOW 1280
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + rawCipherText.length, 'KYBER-CIPHERTEXT-OVERHEAD', rawCipherText.length);