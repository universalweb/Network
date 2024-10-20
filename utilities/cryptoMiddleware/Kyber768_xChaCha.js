// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import { decapsulate, encapsulate, encryptionKeypair } from './kyber768.js';
import { decrypt, encrypt } from './XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId, randomBuffer, toBase64, toHex
} = defaultCrypto;
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
// Create User Kyber keypair send to server
// Server creates Kyber shared Secret & encapsulates it via user's public kyber key
// Server sends cipher text in the header & encrypted intro frame to the user
// Server sets the session with the new secret keys
// User first decapsulates ciphertext with user's private kyber key located in the header
// User then sets the session with the new secret keys
export const kyber768_xchacha20 = {
	name: 'kyber768_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3.',
	id: 2,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	hash: blake3,
	publicKeyInServerIntroHeader: true,
	extendedHandshake: true,
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log('Public Key from destination', destination.publicKey[0]);
	},
	async serverInitializeSession(source, destination) {
		console.log('serverInitializeSession');
		const destinationPublicKey = destination.publicKey;
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		source.publicKey = cipherText;
		source.transmitKey = blake3(sharedSecret);
		source.receiveKey = source.transmitKey;
		console.log('Public Key from destination', destination.publicKey[0]);
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const destinationPublicKey = destination.publicKey;
		const sharedSecret = source.sharedSecret;
		source.transmitKey = blake3(sharedSecret);
		source.receiveKey = source.transmitKey;
		console.log('kyberSharedSecret', sharedSecret[0]);
		source.sharedSecret = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async clientSetSession(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const cipherText = destinationPublicKey;
		const kyberPrivateKey = source.privateKey;
		console.log(cipherText, kyberPrivateKey);
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		console.log('clientSetSession kyberSharedSecret', kyberSharedSecret[0], kyberSharedSecret.length);
		source.transmitKey = blake3(kyberSharedSecret);
		source.receiveKey = source.transmitKey;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	generateSeed() {
		return randomBuffer(64);
	},
	async keypair(kyberSeed) {
		const target = await encryptionKeypair(kyberSeed);
		return target;
	},
	async clientEphemeralKeypair() {
		const source = await kyber768_xchacha20.keypair();
		return source;
	},
	// async serverEphemeralKeypair(source = {}, destination) {
	// 	const destinationPublicKey = destination.publicKey;
	// 	const {
	// 		cipherText,
	// 		sharedSecret
	// 	} = await encapsulate(destinationPublicKey);
	// 	source.publicKey = cipherText;
	// 	source.sharedSecret = sharedSecret;
	// 	console.log('client kyberSharedSecret', sharedSecret[0], sharedSecret.length);
	// 	console.log('client cipherText', cipherText[0], cipherText.length);
	// 	return source;
	// },
	async certificateEncryptionKeypair() {
		const target = await encryptionKeypair();
		return target;
	},
	async serverExtendedHandshake(source, frame) {
		console.log('serverExtendedHandshake');
		source.transmitKey = blake3CombineKeys(source.transmitKey, frame.secretKey);
		source.receiveKey = source.transmitKey;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	decrypt,
	encrypt,
};
// EXAMPLE
// const ogServer = await encryptionKeypair25519();
// const client = await kyber768_xchacha20.clientEphemeralKeypair();
// await kyber768_xchacha20.clientInitializeSession(client, ogServer);
// await kyber768_xchacha20.serverInitializeSession(ogServer, client);
// console.log('CLIENT INITIALIZED', client);
// console.log('OG SERVER', ogServer);
// const server = await kyber768_xchacha20.serverEphemeralKeypair({}, client);
// await kyber768_xchacha20.clientSetSession(client, server);
// await kyber768_xchacha20.serverSetSession(server, client);
// console.log(Buffer.compare(server.transmitKey, client.receiveKey) === 0);
// console.log('CLIENT', client);
// console.log('SERVER', server);
// // TRY AND KEEP ESTIMATED MAX BELOW 1280 (1232)
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + server.publicKey.length, 'KYBER-CIPHERTEXT-OVERHEAD', server.publicKey.length);
// console.log(await kyber768_xchacha20.keypair(), await kyber768_xchacha20.keypair());
