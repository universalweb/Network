import {
	clearBuffer,
	int32,
	int64,
	random32ByteBuffer,
} from '#utilities/cryptography/utils';
import { extendedSynchronizationHeaderRPC, headerExtendedSynchronizationRPC, introHeaderRPC } from '#udsp/rpc/headerRPC';
import { KeyExchange } from './keyExchange.js';
import { findItem } from '@universalweb/utilitylib';
import pqclean from 'pqclean';
// import runBench from '#utilities/benchmark';
import shake256 from '../hash/shake256.js';
// Define the ML-KEM-768 algorithm
// Generate a key pair (public and private keys)
const seedSize = int64;
const sessionKeySize = int32;
const generateKeyPair = pqclean.kem.generateKeyPair;
const algoList = pqclean.kem.supportedAlgorithms;
const { hash256 } = shake256;
// console.log('Supported Algorithms', algoList);
const PrivateKey = pqclean.kem.PrivateKey;
const PublicKey = pqclean.kem.PublicKey;
export async function keyExchangeKeypair(seed) {
	const kyberKeypair = await this.generateKeyPair(this.algorithm);
	return kyberKeypair;
}
export async function clientEphemeralKeypair() {
	const kyberKeypair = await this.generateKeyPair(this.algorithm);
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
		Buffer.from(target.key),
	];
}
class KyberKeyExchange extends KeyExchange {
	constructor(config) {
		super(config);
		const scheme = findItem(algoList, config.algorithm, 'name');
		const {
			publicKeySize,
			privateKeySize,
		} = scheme;
		this.publicKeySize = publicKeySize;
		this.privateKeySize = privateKeySize;
		this.clientPublicKeySize = publicKeySize;
		this.clientPrivateKeySize = privateKeySize;
		this.serverPublicKeySize = publicKeySize;
	}
	preferred = true;
	postQuantum = true;
	hash = shake256;
	async initializeKeypair(source, target = {}) {
		if (source.publicKey) {
			target.publicKey = new PublicKey(this.algorithm, source.publicKey);
			target.publicKeyHash = await hash256(source.publicKey);
		}
		if (source.privateKey) {
			target.privateKey = new PrivateKey(this.algorithm, source.privateKey);
		}
		return target;
	}
	async initializeCertificateKeypair(...args) {
		return this.initializeKeypair(...args);
	}
	// 	serverPrivateKeySize: privateKeySize,
	async onClientInitialization(source, destination) {
		console.log('onClientInitialization', destination);
	}
	async createClientIntro(source, destination, frame, header) {
		source.logInfo('Send Client Intro', source.cipherData);
		header[2] = source.publicKey;
	}
	async onServerClientInitialization(source, destination) {
		source.logInfo('onServerClientInitialization');
	}
	async onClientIntroHeader(server, client, destinationPublicKey) {
		const publicKeyHash = await hash256(destinationPublicKey);
		client.publicKeyHash = publicKeyHash;
		client.publicKey = new PublicKey(this.algorithm, destinationPublicKey);
		// console.log(destination.publicKey.generateKey);
		const [
			cipherData,
			sharedSecret,
		] = await encapsulate(client.publicKey);
		server.sharedSecret = sharedSecret;
		server.cipherData = cipherData;
		server.logInfo('onClientIntroHeader', cipherData, sharedSecret);
		await this.createServerSession(server, client, server);
	}
	async serverSendIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[0] = introHeaderRPC;
		header[1] = source.cipherData;
	}
	async onServerIntroHeader(client, server, cipherData, header) {
		client.logInfo('onServerIntroHeader');
		if (cipherData) {
			client.sharedSecret = await decapsulate(cipherData, client.privateKey);
			client.logInfo('onServerIntroHeader kyberSharedSecret', client.sharedSecret);
			await this.createClientSession(client, server, client);
			client.logInfo('sharedSecret', client.sharedSecret);
			console.log('New Session Keys', client.transmitKey.length, client.receiveKey[0]);
		}
	}
	async onServerIntroHeaderNoFrame(source, destination, cipherData, header) {
		source.logInfo('onServerIntroHeaderNoFrame');
	}
	async onServerIntro(source, destination, cipherData, frame, header) {
		source.logInfo('onServerIntro');
	}
	async onCreateClientExtendedSynchronization(client, server, frame, header) {
		console.log('TRIGGERED onCreateClientExtendedSynchronization');
		// console.log(destination.publicKey);
		const [
			cipherData,
			sharedSecret,
		] = await encapsulate(server.publicKey);
		headerExtendedSynchronizationRPC(header);
		header[2] = cipherData;
		client.cipherData = cipherData;
		client.sharedSecret = sharedSecret;
		console.log('sendClientExtendedSynchronization kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('sendClientExtendedSynchronization cipherText', cipherData[0], cipherData.length);
	}
	async serverExtendedSynchronizationHeader(server, client, frame, header) {
		console.log('serverExtendedSynchronization CIPHER CALLED', frame, header);
		const cipherData = header[2];
		const privateKey = server.privateKey;
		const sharedSecret = await decapsulate(cipherData, privateKey);
		clearBuffer(server.cipherData);
		server.cipherData = null;
		server.sharedSecret = sharedSecret;
		console.log('serverExtendedSynchronization kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		// console.log('Keys', server.transmitKey[0], server.receiveKey[0]);
		// console.log('sharedSecret', server.sharedSecret[0]);
		// console.log('server cipherText', cipherData[0], cipherData.length);
		await this.finalizeExtendedSynchronization(server, client);
	}
	async finalizeExtendedSynchronization(server, client) {
		console.log('finalize Extended Synchronization');
		await this.upgradeSessionKeys(server, client);
		await this.serverCleanupKeyClass(server);
	}
	async sendServerExtendedSynchronization(source, destination, frame, header) {
		console.log('Server Extended Synchronization ack');
		header[1] = extendedSynchronizationHeaderRPC;
	}
	async clientExtendedSynchronization(client, server, frame, header) {
		console.log('clientExtendedSynchronization frame');
		await this.upgradeSessionKeys(client, server);
		client.cipherData = null;
		// await this.serverCleanupKeyServer(source);
	}
	async initializePublicKey(source) {
		return new PublicKey(this.algorithm, source?.publicKey || source);
	}
	async initializePrivateKey(source) {
		return new PrivateKey(this.algorithm, source?.privateKey || source);
	}
	keyExchangeKeypair = keyExchangeKeypair;
	clientEphemeralKeypair = clientEphemeralKeypair;
	PrivateKey = PrivateKey;
	PublicKey = PublicKey;
	encapsulate = encapsulate;
	decapsulate = decapsulate;
	sessionKeySize = sessionKeySize;
	seedSize = seedSize;
	generateKeyPair = generateKeyPair;
}
export default KyberKeyExchange;
async function example() {
	console.clear();
	const kyber768 = new KyberKeyExchange({
		name: 'kyber768',
		alias: 'kyber768',
		id: 1,
		preferred: true,
		postQuantum: true,
		hash: shake256,
		algorithm: 'ml-kem-768',
	});
	// console.log(kyber768);
	// console.log(kyber768.constructor.prototype);
	const client = await kyber768.clientEphemeralKeypair();
	client.logInfo = console.log;
	const cert = await kyber768.exportKeypair(await kyber768.keyExchangeKeypair());
	const server = await kyber768.initializeKeypair(cert);
	server.logInfo = console.log;
	// Server gets client intro
	await kyber768.onClientIntroHeader(server, client, client.publicKeyBuffer);
	// Client gets server intro
	await kyber768.onServerIntroHeader(client, server, server.cipherData);
	console.log('server', server);
	console.log(kyber768.compareSessionkeysThrow(client, server));
	const serverExtendedHeader = [];
	const serverExtendedFrame = [];
	await kyber768.onCreateClientExtendedSynchronization(client, server, serverExtendedFrame, serverExtendedHeader);
	console.log('serverExtendedHeader', serverExtendedHeader);
	await kyber768.serverExtendedSynchronizationHeader(server, client, serverExtendedFrame, serverExtendedHeader);
	await kyber768.clientExtendedSynchronization(client, server);
	// console.log('client', client);
	console.log(kyber768.compareSessionkeysThrow(client, server));
}
// await example();
