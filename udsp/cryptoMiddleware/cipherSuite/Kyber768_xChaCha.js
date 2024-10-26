// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import { decapsulate, encapsulate, encryptionKeypair } from '../keyExchange/kyber768.js';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { extendedHandshakeRPC } from '../../../udsp/protocolFrameRPCs.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	blake3CombineKeys
} = defaultCrypto;
// Create User Kyber keypair send to server
// Server creates Kyber shared Secret & encapsulates it via user's public kyber key
// Server sends cipher text in the header & encrypted intro frame to the user
// Server sets the session with the new secret keys
// User first decapsulates ciphertext with user's private kyber key located in the header
// User then sets the session with the new secret keys
// PRIORITY: Make sure to swap Transmit and Receive keys so both are unique to add an extra layer of security
export const kyber768_xChaCha = {
	name: 'kyber768_xChaCha',
	alias: 'kyber768',
	description: 'Crystals-Kyber768 with XChaCha20 and Blake3.',
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
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		source.transmitKey = blake3(kyberSharedSecret);
		source.receiveKey = source.transmitKey;
		console.log('clientSetSession kyberSharedSecret', kyberSharedSecret[0], kyberSharedSecret.length);
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
		const source = await kyber768_xChaCha.keypair();
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
	async clientExtendedHandshake(source, destination) {
		console.log('clientExtendedHandshake');
		const destinationPublicKey = destination.publicKey;
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		source.sharedSecret = sharedSecret;
		console.log('client kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('client cipherText', cipherText[0], cipherText.length);
		const frame = [
			false, extendedHandshakeRPC, cipherText
		];
		return source;
	},
	async sendClientExtendedHandshake(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		const frame = [
			false,
			extendedHandshakeRPC,
			destinationPublicKey
		];
		destination.sharedSecret = sharedSecret;
		return frame;
	},
	async serverExtendedHandshake(source, destination, frame, header) {
		const [
			streamid_undefined,
			rpc,
			cipherText
		] = frame;
		console.log('serverExtendedHandshake');
		const kyberPrivateKey = source.privateKey;
		const kyberSharedSecret = await decapsulate(cipherText, kyberPrivateKey);
		source.transmitKey = blake3CombineKeys(source.transmitKey, kyberSharedSecret);
		source.receiveKey = source.transmitKey;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async sendServerExtendedHandshake(source, destination) {
		const frame = [
			false,
			extendedHandshakeRPC,
		];
	},
	async clientExtendedHandshakeComplete(source, destination) {
		source.transmitKey = blake3CombineKeys(source.transmitKey, source.sharedSecret);
		source.receiveKey = source.transmitKey;
		source.sharedSecret = null;
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
