import * as defaultCrypto from '#crypto';
import { blake3 } from '@noble/hashes/blake3';
import { isBuffer } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { x25519_xchacha20 } from './25519.js';
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
	signVerifyDetached, signDetached, crypto_aead_xchacha20poly1305_ietf_KEYBYTES, randomBuffer, toBase64
} = defaultCrypto;
export function blake3CombineKeys(key1, key2) {
	console.log(key1, key2);
	const key1Buffer = isBuffer(key1) ? key1 : Buffer.from(key1);
	const key2Buffer = isBuffer(key2) ? key2 : Buffer.from(key2);
	return blake3(Buffer.concat([key1Buffer, key2Buffer]));
}
export function createKyberKeypair(seed) {
	return ml_kem768.keygen(seed);
}
function kyberDecapsulate(source, destinationKeypair, sessionKeysOriginal) {
	const cipherText = destinationKeypair.publicKey.slice(32);
	const { x25519SessionKeys } = source;
	const kyberSharedSecret = ml_kem768.decapsulate(cipherText, source.kyberKeypair.privateKey);
	source.kyberSharedSecret = kyberSharedSecret;
	const sessionKeys = {
		transmitKey: blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret),
		receiveKey: blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret)
	};
	return kyberSharedSecret;
}
export const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	short: 'x25519Kyber768',
	// Hybrid Post Quantum Key Exchange
	alias: 'hpqt',
	id: 1,
	ml_kem768,
	preferred: true,
	hash: blake3,
	x25519ServerSessionKeys: serverSessionKeys,
	x25519ClientSessionKeys: clientSessionKeys,
	kyberDecapsulate,
	async serverSessionKeys(source, destinationKeypair, sessionKeysOriginal) {
		const destinationPublicKey = destinationKeypair.publicKey;
		const x25519SessionKeys = serverSessionKeys(source.x25519Keypair, destinationPublicKey.slice(0, 32));
		source.x25519SessionKeys = x25519SessionKeys;
		console.log(x25519SessionKeys);
		const kyberRelated = destinationKeypair.publicKey.slice(32);
		const kyberSharedSecret = kyberDecapsulate(source, destinationKeypair, sessionKeysOriginal);
		const sessionKeys = {
			transmitKey: blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret),
			receiveKey: blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret)
		};
		return sessionKeys;
	},
	async clientSessionKeys(source, destinationKeypair, sessionKeysOriginal) {
		const destinationPublicKey = destinationKeypair.publicKey;
		const x25519SessionKeys = clientSessionKeys(source.x25519Keypair, destinationPublicKey.slice(0, 32), sessionKeysOriginal);
		const {
			cipherText,
			sharedSecret: kyberSharedSecret
		} = await ml_kem768.encapsulate(source.kyberKeypair.publicKey);
		source.kyberSharedSecret = kyberSharedSecret;
		source.x25519SessionKeys = x25519SessionKeys;
		source.preparedPublicKey = Buffer.concat([source.x25519Keypair.publicKey, cipherText]);
		const sessionKeys = {
			transmitKey: blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret),
			receiveKey: blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret)
		};
		return sessionKeys;
	},
	async loadKeypair(source) {
		const { privateKey } = source;
		const seed = privateKey.slice(32);
		const kyberKeypair = createKyberKeypair(seed);
		const {
			publicKey: kyberPublicKey,
			secretKey: kyberPrivateKey
		} = kyberKeypair;
		source.kyberKeypair = {
			privateKey: kyberPrivateKey,
			publicKey: kyberPublicKey
		};
		source.x25519Keypair = {
			privateKey: privateKey.slice(0, 32),
			publicKey: source.publicKey.slice(0, 32)
		};
	},
	generateKeySeed() {
		return randomBuffer(64);
	},
	createKyberKeypair,
	async ephemeralServerKeypair() {
	},
	async keypair() {
		const x25519Keypair = x25519_xchacha20.keypair();
		const seed = x25519_kyber768_xchacha20.generateKeySeed();
		const kyberKeypair = createKyberKeypair(seed);
		const {
			publicKey: kyberPublicKey,
			secretKey: kyberPrivateKey
		} = kyberKeypair;
		const target = {
			x25519Keypair,
			kyberKeypair: {
				publicKey: kyberPublicKey,
				privateKey: kyberPrivateKey,
				seed
			},
			publicKey: Buffer.concat([x25519Keypair.privateKey, kyberPublicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberPrivateKey])
		};
		return target;
	},
	async certificateEncryptionKeypair() {
		const {
			x25519Keypair,
			kyberKeypair,
			publicKey
		} = x25519_kyber768_xchacha20.keypair();
		const target = {
			publicKey,
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.seed])
		};
		return target;
	},
	combineKeys: blake3CombineKeys
};
const client = await x25519_kyber768_xchacha20.keypair();
const server = await x25519_kyber768_xchacha20.keypair();
const {
	cipherText: rawCipherText, sharedSecret: aliceSharedSecret
} = ml_kem768.encapsulate(client.kyberKeypair.publicKey);
const clientSession = await x25519_kyber768_xchacha20.clientSessionKeys(client, server);
client.publicKey = client.preparedPublicKey;
const serverSession = await x25519_kyber768_xchacha20.serverSessionKeys(server, client);
console.log('Client', clientSession, 'Server', serverSession);
// console.log(alice.kyberKeypair.publicKey.length);
// TRY AND KEEP ESTIMATED MAX BELOW 1280
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + rawCipherText.length, 'KYBER-CIPHERTEXT-OVERHEAD', rawCipherText.length);
