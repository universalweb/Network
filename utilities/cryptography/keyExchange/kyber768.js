import {
	clearBuffer,
	int32,
	int64,
	randomBuffer
} from '#utilities/cryptography/utils';
import { extendedHandshakeHeaderRPC, introHeaderRPC } from '../../../udsp/protocolHeaderRPCs.js';
import { findItem, isBuffer } from '@universalweb/acid';
import { encode } from '#utilities/serialize';
import { keyExchange } from './keyExchange.js';
import pqclean from 'pqclean';
import shake256 from '../hash/shake256.js';
const seedSize = int64;
const sessionKeySize = int32;
const generateKeyPair = pqclean.kem.generateKeyPair;
const algoList = pqclean.kem.supportedAlgorithms;
const schemeName = 'ml-kem-768';
const { hash256 } = shake256;
const scheme = findItem(algoList, schemeName, 'name');
const {
	publicKeySize,
	privateKeySize,
} = scheme;
// console.log('Supported Algorithms', algoList);
const PrivateKey = pqclean.kem.PrivateKey;
const PublicKey = pqclean.kem.PublicKey;
export async function keyExchangeKeypair(seed) {
	const kyberKeypair = await generateKeyPair(schemeName);
	return kyberKeypair;
}
export async function clientEphemeralKeypair() {
	const kyberKeypair = await generateKeyPair(schemeName);
	const publicKeyBuffer = Buffer.from(await kyberKeypair.publicKey.export());
	const publicKeyHash = await hash256(publicKeyBuffer);
	// Hashed for faster session keys generation
	kyberKeypair.publicKeyHash = publicKeyHash;
	kyberKeypair.publicKeyBuffer = publicKeyBuffer;
	return kyberKeypair;
}
export async function decapsulate(cipherData, privateKey) {
	const decapsulated = await privateKey.decryptKey(cipherData);
	return Buffer.from(decapsulated);
}
//  Change to return array instead of object
export async function encapsulate(publicKey) {
	const target = await publicKey.generateKey();
	return [
		Buffer.from(target.encryptedKey),
		Buffer.from(target.key)
	];
}
export const kyber768 = keyExchange({
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	preferred: true,
	postQuantum: true,
	hash: shake256,
	keyExchangeKeypair,
	clientEphemeralKeypair,
	// 	serverPrivateKeySize: privateKeySize,
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
	},
	async serverInitializeSessionMethod(source, destination, destinationPublicKey) {
		const publicKeyHashed = await hash256(destinationPublicKey);
		destination.publicKeyHash = publicKeyHashed;
		destination.publicKey = new PublicKey(schemeName, destinationPublicKey);
		// console.log(destination.publicKey.generateKey);
		const [
			cipherData,
			sharedSecret
		] = await encapsulate(destination.publicKey);
		console.log('serverInitializeSessionMethod', cipherData, sharedSecret);
		source.sharedSecret = sharedSecret;
		source.cipherData = cipherData;
	},
	async serverSendIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[0] = introHeaderRPC;
		header[1] = source.cipherData;
	},
	async clientSetSession(source, destination, cipherData) {
		const kyberPrivateKey = source.privateKey;
		source.sharedSecret = await decapsulate(cipherData, source.privateKey);
		console.log('clientSetSession kyberSharedSecret', source.sharedSecret);
		await this.createClientSession(source, destination, source);
		console.log(source);
		console.log('New Session Keys', source.transmitKey.length, source.receiveKey[0]);
	},
	// This sends a extended handshake frame
	async sendClientExtendedHandshakeHeader(source, destination, frame, header) {
		console.log('TRIGGERED sendClientExtendedHandshake');
		console.log(destination.publicKey);
		const [
			cipherData,
			sharedSecret
		] = await encapsulate(destination.publicKey);
		frame.push(cipherData);
		source.cipherData = cipherData;
		source.sharedSecret = sharedSecret;
		console.log('sendClientExtendedHandshake kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('sendClientExtendedHandshake cipherText', cipherData[0], cipherData.length);
	},
	async serverExtendedHandshake(source, destination, frame, header) {
		console.log('serverExtendedHandshake CIPHER CALLED', frame, header);
		const [
			streamid_undefined,
			rpc,
			cipherData
		] = frame;
		const privateKey = source.privateKey;
		const sharedSecret = await decapsulate(cipherData, source.privateKey);
		clearBuffer(source.cipherData);
		source.cipherData = null;
		source.sharedSecret = sharedSecret;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
		console.log('sharedSecret', source.sharedSecret[0]);
		console.log('server cipherText', cipherData[0], cipherData.length);
		await this.finalizeExtendedHandshake(source, destination);
	},
	async finalizeExtendedHandshake(source, destination) {
		console.log('finalize Extended Handshake');
		await this.finalizeSessionKeys(source, destination);
		await this.serverCleanupKeyClass(source);
	},
	async sendServerExtendedHandshake(source, destination, frame, header) {
		console.log('Server Extended Handshake ack');
		header[0] = extendedHandshakeHeaderRPC;
	},
	async clientExtendedHandshake(source, destination, frame, header) {
		console.log('clientExtendedHandshake frame');
		await this.serverCleanupKeyServer(source);
	},
	async initializeKeypair(source, target = {}) {
		if (source.publicKey) {
			target.publicKey = new PublicKey(schemeName, source.publicKey);
			target.publicKeyHash = await hash256(source.publicKey);
		}
		if (source.privateKey) {
			target.privateKey = new PrivateKey(schemeName, source.privateKey);
		}
		return target;
	},
	async initializeCertificateKeypair(...args) {
		return this.initializeKeypair(...args);
	},
	async initializePublicKey(source) {
		return new PublicKey(schemeName, source?.publicKey || source);
	},
	async initializePrivateKey(source) {
		return new PrivateKey(schemeName, source?.privateKey || source);
	},
	schemeName,
	PrivateKey,
	PublicKey,
	encapsulate,
	decapsulate,
	sessionKeySize,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
});
export default kyber768;
// const cert = await kyber768.certificateKeyExchangeKeypair();
// console.log(cert);
// const client = await kyber768.clientEphemeralKeypair();
// const cert = await kyber768.exportKeypair(await kyber768.keyExchangeKeypair());
// const server = await kyber768.initializeKeypair(cert);
// await kyber768.clientInitializeSession(client, server);
// console.log('clientInitializeSession', client);
// await kyber768.serverInitializeSession(server, client, client.publicKeyBuffer);
// console.log('server', server);
// await kyber768.clientSetSession(client, server, server.cipherData);
// console.log(client);
// const frme = [];
// await kyber768.sendClientExtendedHandshakeHeader(client, server, frme);
// console.log(frme);
// console.log(server);
// await kyber768.serverExtendedHandshake(server, client, [
// 	undefined,
// 	undefined,
// 	frme[0]
// ]);
// await kyber768.sendServerExtendedHandshake(server, client);
// console.log('server', server);
// await kyber768.clientExtendedHandshakeHeader(client, server);
// console.log('client', client);
// console.log('server', server);
