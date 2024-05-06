import * as defaultCrypto from '#crypto';
import { blake3 } from '@noble/hashes/blake3';
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
	return blake3(Buffer.concat([key1, key2]));
}
export function createKyberKeypair(seed) {
	return ml_kem768.keygen(seed);
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
	async serverSessionKeys(source, destinationPublicKey, sessionKeysOriginal) {
		const x25519sessionKeys = serverSessionKeys(source, destinationPublicKey.slice(0, 32), sessionKeysOriginal);
		const destinationKyberPublicKey = destinationPublicKey.slice(32);
		const [
			cipherText,
			kyberSharedSecret
		] = await source.kyberKeypair.encap(destinationKyberPublicKey);
		source.kyberSharedSecret = kyberSharedSecret;
		source.x25519sessionKeys = x25519sessionKeys;
		source.preparedPublicKey = Buffer.concat([source.x25519Keypair.publicKey, cipherText]);
		source.cipherText = cipherText;
		const sessionKeys = {
			transmitKey: blake3CombineKeys(x25519sessionKeys.transmit, kyberSharedSecret),
			receiveKey: blake3CombineKeys(x25519sessionKeys.receive, kyberSharedSecret)
		};
		return sessionKeys;
	},
	async clientSessionKeys(source, destinationPublicKey, sessionKeysOriginal) {
		const x25519sessionKeys = clientSessionKeys(source, destinationPublicKey.slice(0, 32), sessionKeysOriginal);
		const destinationKyberPublicKey = destinationPublicKey.slice(32);
		const [
			cipherText,
			kyberSharedSecret
		] = await source.kyberKeypair.encap(destinationKyberPublicKey);
		source.kyberSharedSecret = kyberSharedSecret;
		source.x25519sessionKeys = x25519sessionKeys;
		source.preparedPublicKey = Buffer.concat([source.x25519Keypair.publicKey, cipherText]);
		source.cipherText = cipherText;
		const sessionKeys = {
			transmitKey: blake3CombineKeys(x25519sessionKeys.transmit, kyberSharedSecret),
			receiveKey: blake3CombineKeys(x25519sessionKeys.receive, kyberSharedSecret)
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
const alice = await x25519_kyber768_xchacha20.keypair();
const bob = await x25519_kyber768_xchacha20.keypair();
console.log(alice, bob);
const {
	cipherText: rawCipherText, sharedSecret: aliceSharedSecret
} = ml_kem768.encapsulate(bob.kyberKeypair.publicKey);
console.log(rawCipherText, aliceSharedSecret);
const bobSharedSecret = ml_kem768.decapsulate(rawCipherText, bob.kyberKeypair.privateKey);
console.log('ALICE', aliceSharedSecret, 'BOB', bobSharedSecret, Buffer.from(aliceSharedSecret).equals(Buffer.from(bobSharedSecret)));
