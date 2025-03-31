// CONVERT THIS TO SHAKE256 AFTER x25519_blake3 is done
// Consider SHAKE256 as the hash function for x25519_shake256 variant
import {
	clearBuffer,
	clearBuffers,
	int32,
	randomBuffer,
	toBase64,
	toHex
} from '#utilities/cryptography/utils';
import { assign } from '@universalweb/acid';
import hash from '../hash/shake256.js';
import { introHeaderRPC } from '../../../udsp/protocolHeaderRPCs.js';
import keyExchange from './keyExchange.js';
import kyber768 from './kyber768.js';
import pqclean from 'pqclean';
import x25519 from './x25519.js';
const publicKeySize = x25519.publicKeySize + kyber768.publicKeySize;
const privateKeySize = x25519.privateKeySize + kyber768.privateKeySize;
const {
	schemeName,
	PrivateKey,
	PublicKey
} = kyber768;
export function getKyberKey(source) {
	return source.subarray(int32);
}
export function getX25519Key(source) {
	return source.subarray(0, int32);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, int32);
}
export function getX25519Keypair(source) {
	return {
		publicKey: getX25519Key(source.publicKey),
		privateKey: getX25519Key(source.privateKey)
	};
}
export function getKyberKeypair(source) {
	const kyberKeypair = {};
	if (source.publicKey) {
		kyberKeypair.publicKey = getKyberKey(source.publicKey);
	}
	if (source.privateKey) {
		kyberKeypair.privateKey = getKyberKey(source.privateKey);
	}
	return kyberKeypair;
}
async function certificateKeyExchangeKeypair() {
	const x25519Keypair = await x25519.certificateKeyExchangeKeypair();
	const kyberKeypair = await kyber768.certificateKeyExchangeKeypair();
	const target = {
		publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
		privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey]),
	};
	return target;
}
async function keyExchangeKeypair() {
	const x25519Keypair = await x25519.keyExchangeKeypair();
	const kyberKeypairInstance = await kyber768.keyExchangeKeypair();
	// const kyberKeypair = await kyber768.exportKeypair(kyberKeypairInstance);
	const target = {
		// publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
		// privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey]),
		x25519Keypair,
		kyberKeypair: kyberKeypairInstance
	};
	return target;
}
async function clientEphemeralKeypair() {
	const x25519Keypair = await x25519.clientEphemeralKeypair();
	const kyberKeypair = await kyber768.keyExchangeKeypair();
	const publicKeyBufferKyber = Buffer.from(await kyberKeypair.publicKey.export());
	const publicKeyBuffer = Buffer.concat([x25519Keypair.publicKey, publicKeyBufferKyber]);
	const target = {
		x25519Keypair,
		kyberKeypair,
		publicKeyBuffer
	};
	return target;
}
async function serverEphemeralKeypair(source) {
	const x25519Keypair = await x25519.keyExchangeKeypair(source);
	source.x25519Keypair = x25519Keypair;
	return source;
}
async function kyber768InitializeKeypair(source, target = {}) {
	if (source.publicKey) {
		target.publicKey = new PublicKey(schemeName, source.publicKey);
	}
	if (source.privateKey) {
		target.privateKey = new PrivateKey(schemeName, source.privateKey);
	}
	return target;
}
async function initializeKeypair(keypair, target) {
	const x25519KeypairRaw = await getX25519Keypair(keypair);
	const kyberKeypairRaw = await getKyberKeypair(keypair);
	console.log('kyberKeypairRaw', kyberKeypairRaw);
	const x25519Keypair = await x25519.initializeKeypair(x25519KeypairRaw);
	const kyberKeypair = await kyber768InitializeKeypair(kyberKeypairRaw);
	if (target) {
		target.x25519Keypair = x25519Keypair;
		target.kyberKeypair = kyberKeypair;
		return target;
	}
	return {
		x25519Keypair,
		kyberKeypair
	};
}
async function initializeCertificateKeypair(keypair, target) {
	const result = await initializeKeypair(keypair, target);
	return result;
}
async function exportKeypair(source) {
	const x25519Keypair = await x25519.exportKeypair(source.x25519Keypair);
	const kyberKeypair = await kyber768.exportKeypair(source.kyberKeypair);
	const target = {
		publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
		privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
	};
	return target;
}
export const kyber768_x25519 = keyExchange({
	name: 'kyber768_x25519',
	alias: 'kyber768_x25519',
	description: 'Crystals-Kyber768 with X25519 and SHAKE256.',
	id: 3,
	keyExchangeKeypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	initializeCertificateKeypair,
	exportKeypair,
	initializeKeypair,
	// partial initial encryption on first packet
	async clientInitializeSession(source, destination) {
		source.x25519Keypair.sharedSecret = await x25519.getSharedSecret(source.x25519Keypair, destination.x25519Keypair);
	},
	async serverClientCreation(client, server) {
		client.x25519Keypair = assign({}, server.x25519Keypair);
		client.kyberKeypair = assign({}, server.kyberKeypair);
	},
	async createServerSession(source, destination, target, x25519KeypairSharedSecret, kyberKeypairSharedSecret) {
		const sessionKeyHash = await this.hash.concatHash512(
			x25519KeypairSharedSecret,
			kyberKeypairSharedSecret,
			destination.x25519Keypair.publicKey,
			source.x25519Keypair.publicKey,
		);
		clearBuffer(x25519KeypairSharedSecret);
		clearBuffer(kyberKeypairSharedSecret);
		const receiveKey = sessionKeyHash.subarray(this.sessionKeySize);
		const transmitKey = sessionKeyHash.subarray(0, this.sessionKeySize);
		if (target) {
			target.sessionKeyHash = sessionKeyHash;
			target.receiveKey = receiveKey;
			target.transmitKey = transmitKey;
			return target;
		}
		return {
			sessionKeyHash,
			receiveKey,
			transmitKey
		};
	},
	// do first shared secret then generate next and create new session keys already?
	async serverInitializeSession(source, destination, clientCipherData) {
		destination.x25519Keypair.publicKey = getX25519Key(clientCipherData);
		const x25519KeypairSharedSecret = await x25519.getSharedSecret(source.x25519Keypair, destination.x25519Keypair);
		assign(source.x25519Keypair = await x25519.keyExchangeKeypair());
		const x25519KeypairSharedSecretNextSession = await x25519.getSharedSecret(source.x25519Keypair, destination.x25519Keypair);
		const kyberClientPublicKey = await kyber768.initializePublicKey(getKyberKey(clientCipherData));
		const {
			cipherData,
			sharedSecret
		} = await kyber768.encapsulate(kyberClientPublicKey);
		source.cipherData = Buffer.concat([source.x25519Keypair.nextSession.publicKey, cipherData]);
		clearBuffer(cipherData);
		await this.createServerSession(source, destination, source, x25519KeypairSharedSecret, sharedSecret);
	},
	async serverSendIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[0] = introHeaderRPC;
		header[1] = source.cipherData;
	},
	hash,
	noneQuatumPublicKeySize: x25519.publicKeySize,
	noneQuatumPrivateKeySize: x25519.privateKeySize,
	quantumPublicKeySize: kyber768.publicKeySize,
	quantumPrivateKeySize: kyber768.privateKeySize,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	cipherSuiteCompatibility: {
		recommended: 3,
		postQuantumRecommended: 3,
		lowestSupported: 0,
		maxSupported: 3,
		0: true,
		1: true,
		2: true,
		3: true
	},
	preferred: true,
	preferredPostQuantum: true,
	speed: 0,
	security: 1,
});
export default kyber768_x25519;
const clint = await kyber768_x25519.clientEphemeralKeypair();
const cert = await kyber768_x25519.certificateKeyExchangeKeypair();
console.log('cert', cert);
const srvr = {};
await kyber768_x25519.initializeCertificateKeypair(cert, srvr);
console.log('server', srvr);
console.log('publicKeySize', publicKeySize);
// await kyber768_x25519.clientInitializeSession(clint, srvr);
// console.log('clientInitializeSession', clint);
// console.log('server', srvr);
// await kyber768_x25519.serverInitializeSession(srvr, clint, clint.publicKeyBuffer);
// console.log('server', srvr);
// await kyber768.clientSetSession(client, srvr, srvr.cipherData);
// console.log(client);
// const frme = [];
// await kyber768.sendClientExtendedSynchronizationHeader(client, srvr, frme);
// console.log(frme);
// console.log(srvr);
// await kyber768.serverExtendedSynchronization(srvr, client, [
// 	undefined,
// 	undefined,
// 	frme[0]
// ]);
// await kyber768.sendServerExtendedSynchronization(server, client);
// console.log('server', server);
// await kyber768.clientExtendedSynchronizationHeader(client, server);
// console.log('client', client);
// console.log('server', server);
