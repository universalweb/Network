// Closed source not for private and or corporate use.
/*
	SUMMARY:
	In the first initial packet x25519 encryption can already be used.
	Both the server and client have a functioning x25519 key exchange with their first packets.
	From there the key exchange process incorporates the kyber768 key exchange.
	Session keys are created by hashing the combined keys of the prior session keys and the new ones.
	Hashing ensures that keys remain the same size, ensure consistant performance, reduces memory, and authenticates the domain certificate/server in the process.
	Hashing prior keys ensures a continuous historical session.
	PROCESS:
	The client sends a x25519 public key & a kyber public key.
	After the first packet is sent from the server the client & the server will generate a kyber shared secret based on the clients public kyber key.
	The server will encapsulate the shared secret with the client's public kyber key.
	The server will then send the encapsulated shared secret & a new ephemeral 25519 public key to the client
	The client then completes the new x25519 key exchange.
	The client will then use the new x25519 shared keys & the kyber shared secret
	The client will use the domain certificate's public kyber key to generate another shared secret.
	The client sends the encapsulated shared secret created from the kyber public key in the domain certificate to the server.
	The client and server then update their session keys with the new shared secrets.
	The session keys are hashed based on the prior session keys used initially.
 */
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import { decrypt, encrypt, encryptionOverhead } from '../encryption/XChaCha.js';
import { get25519KeyCopy, x25519 } from '../keyExchange/x25519_blake3.js';
import { encapsulate } from '../keyExchange/kyber768.js';
import { extendedHandshakeRPC } from '../../udsp/protocolFrameRPCs.js';
import { kyber768_x25519 } from '../keyExchange/kyber768_x25519.js';
import { shake256 } from '@noble/hashes/sha3';
import { x25519_kyber768Half_xchacha20 } from './x25519_Kyber768Half_xChaCha.js';
// CHANGE THIS TO BE SAFE TO ITS OWN AT kyber768_x25519
const { clientSetSession } = x25519_kyber768Half_xchacha20;
const {
	serverSetSessionAttach,
	clientSetSession: clientSetSessionX25519,
} = x25519;
const {
	randomBuffer,
	toBase64,
	toHex,
	shake254_512
} = defaultCrypto;
const hashFunction = shake254_512;
const {
	clientInitializeSession,
	serverInitializeSession,
	serverSetSession,
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
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 + X25519 with XChaCha20 and SHAKE256.',
	id: 3,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	async clientEphemeralKeypair() {
		const source = await keypair();
		return source;
	},
	clientInitializeSession,
	clientSetSession,
	// CHANGE TO NEW HEADER & FRAME ARGS
	async sendClientExtendedHandshake(source, destination, frame, header) {
		const destinationPublicKey = destination.publicKey;
		console.log('TRIGGERED sendClientExtendedHandshake');
		console.log(destinationPublicKey.length);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		frame.push(cipherText);
		source.cipherData = cipherText;
		source.sharedSecret = sharedSecret;
		console.log('sendClientExtendedHandshake kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('sendClientExtendedHandshake cipherText', cipherText[0], cipherText.length);
	},
	async serverInitializeSession(source, destination, cipherData) {
		console.log('serverInitializeSession CIPHER', toHex(cipherData));
		destination.publicKey = get25519KeyCopy(cipherData);
		await serverSetSessionAttach(source, destination);
		source.nextSession = await kyber768_x25519.serverEphemeralKeypair(source, destination, cipherData);
		clearBuffer(cipherData);
		console.log('nextSession', source.nextSession);
	},
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.nextSession.publicKey);
		frame[3] = source.nextSession.publicKey;
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
	hash: hashFunction,
	encrypt,
	decrypt,
	encryptionOverhead
};
// copyright © Thomas Marchi
