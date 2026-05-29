import {
	clearBuffer,
	int32,
	int64,
} from '#utilities/cryptography/utils';
import {
	extendedAuthHeaderRPC,
	extendedSynchronizationHeaderRPC,
	headerExtendedSynchronizationRPC,
	introHeaderRPC,
} from '#udsp/rpc/headerRPC';
import { KeyExchange } from './keyExchange.js';
import crypto from 'node:crypto';
import { findItem } from '@universalweb/utilitylib';
import shake256 from '../hash/shake.js';
const sessionKeySize = int32;
const algoList = [
	{
		name: 'ml-kem-768',
		publicKeySize: 1184,
		/*
			Serializable private key is the 64-byte FIPS 203 keygen seed (d‖z). The expanded
			2400-byte decapsulation key only ever lives inside the KeyObject — native crypto
			never emits it, so the seed IS the portable private form.
		*/
		privateKeySize: int64,
		expandedPrivateKeySize: 2400,
		seedSize: int64,
		// ML-KEM.KeyGen draws two independent 32-byte seeds; both are required to reproduce a key
		seedSegments: [
			{ name: 'd', size: int32, role: 'expansion' },
			{ name: 'z', size: int32, role: 'implicitRejection' },
		],
	},
];
const primaryAlgo = algoList[0];
const seedSize = primaryAlgo.seedSize;
const RAW_PUBLIC_KEY_SIZE = primaryAlgo.publicKeySize;
const { hash256 } = shake256;
/**
 * Native crypto rejects bare ML-KEM key/seed bytes — it only ingests DER. Peers send raw
 * public keys and we serialize private keys as the raw d‖z seed, so both get re-wrapped with
 * their scheme DER headers on the way back in. Derived once from a probe key so the OID and
 * length bytes track exactly what OpenSSL emits, instead of rotting as hardcoded 768-only
 * blobs the moment another variant joins algoList.
 */
function deriveDerPrefixes(algorithm, rawPublicKeySize, seedByteLength) {
	const {
		publicKey, privateKey,
	} = crypto.generateKeyPairSync(algorithm);
	const spki = publicKey.export({
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'spki',
	});
	const pkcs8 = privateKey.export({
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'pkcs8',
	});
	return {
		spkiPrefix: Buffer.from(spki.subarray(0, spki.length - rawPublicKeySize)),
		seedPkcs8Prefix: Buffer.from(pkcs8.subarray(0, pkcs8.length - seedByteLength)),
	};
}
const {
	spkiPrefix: SPKI_PREFIX,
	seedPkcs8Prefix: PKCS8_SEED_PREFIX,
} = deriveDerPrefixes(primaryAlgo.name, RAW_PUBLIC_KEY_SIZE, seedSize);
function privateKeyFromSeed(seed) {
	if (seed.length !== seedSize) {
		throw new Error(`ml-kem seed must be ${seedSize} bytes (d‖z); received ${seed.length}`);
	}
	const der = Buffer.concat([PKCS8_SEED_PREFIX, seed]);
	return crypto.createPrivateKey({
		key: der,
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'pkcs8',
	});
}
class PublicKey {
	constructor(algorithm, data) {
		this.algorithm = algorithm;
		if (data instanceof crypto.KeyObject) {
			this.key = data;
		} else {
			const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
			if (buf.length === RAW_PUBLIC_KEY_SIZE) {
				const der = Buffer.concat([SPKI_PREFIX, buf]);
				this.key = crypto.createPublicKey({
					key: der,
					format: 'der',
					/* eslint-disable-next-line no-restricted-syntax */
					type: 'spki',
				});
			} else {
				this.key = crypto.createPublicKey({
					key: buf,
					format: 'der',
					/* eslint-disable-next-line no-restricted-syntax */
					type: 'spki',
				});
			}
		}
	}
	async export() {
		const der = this.key.export({
			format: 'der',
			/* eslint-disable-next-line no-restricted-syntax */
			type: 'spki',
		});
		// Strip the SPKI header back to the raw key. Copy the exact window — .buffer alone
		// returns the whole backing store and ignores byteOffset, leaking the prefix.
		const raw = der.subarray(SPKI_PREFIX.length);
		return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
	}
	async generateKey() {
		const {
			sharedKey, ciphertext,
		} = crypto.encapsulate(this.key);
		return {
			encryptedKey: ciphertext,
			key: sharedKey,
		};
	}
}
class PrivateKey {
	constructor(algorithm, data) {
		this.algorithm = algorithm;
		if (data instanceof crypto.KeyObject) {
			this.key = data;
		} else {
			const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
			// A bare d‖z seed needs the PKCS8 header re-attached; a full DER passes straight through
			const der = (buf.length === seedSize) ? Buffer.concat([PKCS8_SEED_PREFIX, buf]) : buf;
			this.key = crypto.createPrivateKey({
				key: der,
				format: 'der',
				/* eslint-disable-next-line no-restricted-syntax */
				type: 'pkcs8',
			});
		}
	}
	async export() {
		const der = this.key.export({
			format: 'der',
			/* eslint-disable-next-line no-restricted-syntax */
			type: 'pkcs8',
		});
		// Native PKCS8 is seed-format — strip the ASN.1 header to the raw d‖z seed (the portable private)
		const seed = der.subarray(der.length - seedSize);
		return seed.buffer.slice(seed.byteOffset, seed.byteOffset + seed.byteLength);
	}
	async decryptKey(ciphertext) {
		return crypto.decapsulate(this.key, ciphertext);
	}
}
export async function generateKeyPair(algorithm = primaryAlgo.name, seed) {
	if (seed) {
		const seedBuffer = Buffer.isBuffer(seed) ? seed : Buffer.from(seed);
		const privateKeyObject = privateKeyFromSeed(seedBuffer);
		return {
			publicKey: new PublicKey(algorithm, crypto.createPublicKey(privateKeyObject)),
			privateKey: new PrivateKey(algorithm, privateKeyObject),
		};
	}
	const {
		publicKey, privateKey,
	} = crypto.generateKeyPairSync(algorithm);
	return {
		publicKey: new PublicKey(algorithm, publicKey),
		privateKey: new PrivateKey(algorithm, privateKey),
	};
}
export async function keyExchangeKeypair(seed) {
	return this.generateKeyPair(this.algorithm, seed);
}
export async function clientEphemeralKeypair() {
	const kyberKeypair = await this.generateKeyPair(this.algorithm);
	const publicKeyBuffer = Buffer.from(await kyberKeypair.publicKey.export());
	const publicKeyHash = await hash256(publicKeyBuffer);
	kyberKeypair.publicKeyHash = publicKeyHash;
	kyberKeypair.publicKeyBuffer = publicKeyBuffer;
	return kyberKeypair;
}
export async function serverEphemeralKeypair() {
	const kyberKeypair = await this.generateKeyPair(this.algorithm);
	const publicKeyBuffer = Buffer.from(await kyberKeypair.publicKey.export());
	const publicKeyHash = await hash256(publicKeyBuffer);
	kyberKeypair.publicKeyHash = publicKeyHash;
	kyberKeypair.publicKeyBuffer = publicKeyBuffer;
	return kyberKeypair;
}
export async function decapsulate(cipherData, privateKey) {
	const decapsulated = await privateKey.decryptKey(cipherData);
	return Buffer.from(decapsulated);
}
export async function encapsulate(publicKey) {
	const target = await publicKey.generateKey();
	return [
		Buffer.from(target.encryptedKey),
		Buffer.from(target.key),
	];
}
class KyberNativeKeyExchange extends KeyExchange {
	constructor(config) {
		super(config);
		// NOTE: Make sure correct key sizes are used avoid default values fail if not found
		const scheme = findItem(algoList, config.algorithm, 'name') || {
			publicKeySize: RAW_PUBLIC_KEY_SIZE,
			privateKeySize: seedSize,
		};
		const {
			publicKeySize, privateKeySize,
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
	}
	async createServerEphemeralExtendedSyncAuth(server, client, frame, header) {
		header[1] = extendedAuthHeaderRPC;
		header[2] = server.publicKeyBuffer;
	}
	async onServerEphemeralExtendedSyncAuth(source, destination, frame, header) {
		console.log('onServerEphemeralExtendedSyncAuth frame');
	}
	async clientAuth(client, server, frame, header) {
		console.log('clientAuth frame');
	}
	async initializePublicKey(source) {
		return new PublicKey(this.algorithm, source?.publicKey || source);
	}
	async initializePrivateKey(source) {
		return new PrivateKey(this.algorithm, source?.privateKey || source);
	}
	keyExchangeKeypair = keyExchangeKeypair;
	clientEphemeralKeypair = clientEphemeralKeypair;
	serverEphemeralKeypair = serverEphemeralKeypair;
	PrivateKey = PrivateKey;
	PublicKey = PublicKey;
	encapsulate = encapsulate;
	decapsulate = decapsulate;
	sessionKeySize = sessionKeySize;
	seedSize = seedSize;
	generateKeyPair = generateKeyPair;
}
export default KyberNativeKeyExchange;
async function example() {
	console.clear();
	const kyber768 = new KyberNativeKeyExchange({
		name: 'kyber768',
		alias: 'kyber768',
		id: 1,
		preferred: true,
		postQuantum: true,
		hash: shake256,
		algorithm: 'ml-kem-768',
	});
	const client = await kyber768.clientEphemeralKeypair();
	client.logInfo = console.log;
	const cert = await kyber768.exportKeypair(await kyber768.keyExchangeKeypair());
	const server = await kyber768.initializeKeypair(cert);
	server.logInfo = console.log;
	await kyber768.onClientIntroHeader(server, client, client.publicKeyBuffer);
	await kyber768.onServerIntroHeader(client, server, server.cipherData);
	console.log('server', server);
	console.log(kyber768.compareSessionkeysThrow(client, server));
	const serverExtendedHeader = [];
	const serverExtendedFrame = [];
	await kyber768.onCreateClientExtendedSynchronization(client, server, serverExtendedFrame, serverExtendedHeader);
	console.log('serverExtendedHeader', serverExtendedHeader);
	await kyber768.serverExtendedSynchronizationHeader(server, client, serverExtendedFrame, serverExtendedHeader);
	await kyber768.clientExtendedSynchronization(client, server);
	console.log(kyber768.compareSessionkeysThrow(client, server));
}
// await example();
