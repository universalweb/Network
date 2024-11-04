// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clear, isBuffer } from '@universalweb/acid';
import { decapsulate, encapsulate, encryptionKeypair } from '../keyExchange/kyber768.js';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { blake3 } from '@noble/hashes/blake3';
import { extendedHandshakeRPC } from '../../../udsp/protocolFrameRPCs.js';
import { introHeaderRPC } from '../../protocolHeaderRPCs.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	blake3CombineKeys,
	clearBuffer
} = defaultCrypto;
const hash = blake3;
const combineKeys = blake3CombineKeys;
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
	hash,
	extendedHandshake: true,
	async clientEphemeralKeypair() {
		const source = await kyber768_xChaCha.keypair();
		return source;
	},
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log('Public Key from destination', destination.publicKey[0]);
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
	async clientExtendedHandshake(source, destination) {
		console.log('TRIGGERED client ExtendedHandshake', source.transmitKey, source.sharedSecret);
		source.transmitKey = combineKeys(source.transmitKey, source.sharedSecret);
		source.receiveKey = source.transmitKey;
		clearBuffer(source.sharedSecret);
		clearBuffer(source.cipherData);
		source.sharedSecret = null;
		source.cipherData = null;
		console.log('TRIGGERED client ExtendedHandshake', source.transmitKey);
	},
	async clientSetSession(source, destination, cipherData) {
		const kyberPrivateKey = source.privateKey;
		const sharedSecret = await decapsulate(cipherData, kyberPrivateKey);
		source.transmitKey = sharedSecret;
		source.receiveKey = source.transmitKey;
		console.log('clientSetSession kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async serverInitializeSession(source, destination, destinationPublicKey) {
		console.log('server InitializeSession');
		console.log(destinationPublicKey);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		destination.publicKey = destinationPublicKey;
		source.cipherData = cipherText;
		source.transmitKey = sharedSecret;
		source.receiveKey = sharedSecret;
		console.log('server kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('destinationPublicKey', destinationPublicKey[0]);
	},
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[0] = introHeaderRPC;
		header[1] = source.cipherData;
	},
	async serverExtendedHandshake(source, destination, frame, header) {
		if (!source.sharedSecret) {
			console.log('serverExtendedHandshake CIPHER CALLED', frame, header);
			const [
				streamid_undefined,
				rpc,
				cipherData
			] = frame;
			const privateKey = source.privateKey;
			const sharedSecret = await decapsulate(cipherData, privateKey);
			clearBuffer(source.cipherData);
			source.cipherData = null;
			source.sharedSecret = sharedSecret;
			source.nextSession = true;
			console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
			console.log('sharedSecret', source.sharedSecret[0]);
			console.log('server cipherText', cipherData[0], cipherData.length);
		}
	},
	async sendServerExtendedHandshake(source, destination) {
		const frame = [
			false,
			extendedHandshakeRPC,
		];
		return frame;
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const sharedSecret = source.sharedSecret;
		source.transmitKey = combineKeys(source.transmitKey, sharedSecret);
		source.receiveKey = source.transmitKey;
		clearBuffer(source.sharedSecret);
		source.sharedSecret = null;
		source.nextSession = null;
		console.log('kyberSharedSecret', sharedSecret[0]);
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	generateSeed() {
		return randomBuffer(64);
	},
	async keypair(kyberSeed) {
		const target = await encryptionKeypair(kyberSeed);
		return target;
	},
	async certificateEncryptionKeypair() {
		const target = await encryptionKeypair();
		return target;
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
