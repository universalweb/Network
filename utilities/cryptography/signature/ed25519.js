import {
	bufferAlloc,
	clearBuffer,
	randomBuffer,
	toBase64,
	toHex,
} from '#utilities/cryptography/utils';
import hash from '../hash/shake256.js';
const {
	hash256,
	hash512,
} = hash;
import { signatureScheme } from './signatureScheme.js';
const sodium = await import('sodium-native');
const libsodium = sodium?.default || sodium;
const {
	crypto_sign,
	crypto_sign_BYTES,
	crypto_sign_detached,
	crypto_sign_keypair,
	crypto_sign_open,
	crypto_sign_verify_detached,
	crypto_sign_ed25519_pk_to_curve25519,
	crypto_sign_ed25519_sk_to_curve25519,
	crypto_sign_ed25519_sk_to_pk,
	crypto_sign_ed25519_sk_to_seed,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
} = libsodium;
const generateKeypair = crypto_sign_keypair;
const publicKeySize = 32;
const privateKeySize = 32;
const combinedKeySize = publicKeySize + privateKeySize;
const signatureSize = 64;
const seedSize = 32;
export async function createKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(publicKeySize);
	const privateKey = config?.privateKey || bufferAlloc(combinedKeySize);
	await generateKeypair(publicKey, privateKey);
	if (config) {
		config.publicKey = publicKey;
		config.privateKey = privateKey;
		return config;
	}
	return {
		publicKey,
		privateKey,
	};
}
export async function exportKeypair(source) {
	return {
		publicKey: source.publicKey,
		privateKey: source.privateKey.subarray(0, privateKeySize),
	};
}
export function signCombinedMethod(message, privateKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, privateKey?.privateKey || privateKey);
	return signedMessage;
}
export function signMethod(message, privateKey) {
	const signature = bufferAlloc(crypto_sign_BYTES);
	crypto_sign_detached(signature, message, privateKey?.privateKey || privateKey);
	return signature;
}
export function verifySignatureCombinedMethod(signedMessage, publicKey) {
	const message = bufferAlloc(signedMessage.length - crypto_sign_BYTES);
	const verify = crypto_sign_open(message, signedMessage, publicKey?.publicKey || publicKey);
	return verify && message;
}
export function verifyMethod(signature, message, publicKey) {
	return crypto_sign_verify_detached(signature, message, publicKey?.publicKey || publicKey);
}
export function signaturePublicKeyToEncryptPublicKey(originalPublicKey) {
	const publicKey = bufferAlloc(publicKeySize);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalPublicKey);
	return publicKey;
}
export function signaturePrivateKeyToEncryptPrivateKey(originalPrivateKey) {
	const privateKey = bufferAlloc(privateKeySize);
	crypto_sign_ed25519_sk_to_curve25519(privateKey, originalPrivateKey);
	return privateKey;
}
export function signatureKeypairToEncryptionKeypair(originalKeypair) {
	const result = {};
	if (originalKeypair.publicKey) {
		result.publicKey = signaturePublicKeyToEncryptPublicKey(originalKeypair.publicKey);
	}
	if (originalKeypair.privateKey) {
		result.privateKey = signaturePrivateKeyToEncryptPrivateKey(originalKeypair.privateKey);
	}
	return result;
}
export function generatePublicKey(privateKey) {
	if (privateKey.length === combinedKeySize) {
		return privateKey.subarray(privateKeySize);
	}
	const publicKey = bufferAlloc(publicKeySize);
	crypto_sign_ed25519_sk_to_pk(publicKey, privateKey);
	return publicKey;
}
export async function initializeKeypair(source) {
	const target = {};
	if (source.privateKey) {
		target.privateKey = source.privateKey;
	}
	if (source.publicKey) {
		target.publicKey = source.publicKey;
	}
	if (!source.publicKey && source.privateKey) {
		if (source.privateKey.length === this.combinedKeySize) {
			target.publicKey = source.privateKey.subarray(privateKeySize);
		} else {
			const publicKey = bufferAlloc(publicKeySize);
			await generatePublicKey(publicKey, source.privateKey);
			target.publicKey = publicKey;
		}
	}
	if (target.privateKey && target.privateKey.length !== this.combinedKeySize) {
		target.privateKey = Buffer.concat([source.privateKey, source.publicKey]);
	}
	return target;
}
export function getPublicKey(source) {
	return source.publicKey;
}
export const ed25519 = signatureScheme({
	name: 'ed25519',
	alias: 'ed25519',
	id: 0,
	security: 0,
	speed: 0,
	publicKeySize,
	privateKeySize,
	signatureSize,
	combinedKeySize,
	seedSize,
	createKeypair,
	getPublicKey,
	generatePublicKey,
	verifyMethod,
	signMethod,
	hash256,
	hash512,
	hash: hash256,
	signCombinedMethod,
	verifySignatureCombinedMethod,
	signatureKeypairToEncryptionKeypair,
	signaturePrivateKeyToEncryptPrivateKey,
	exportKeypair,
	initializeKeypair,
	preferred: false,
});
export default ed25519;
// const key = await ed25519.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await ed25519.sign(msg, key);
// console.log(sig, sig.length);
// console.log(await ed25519.verify(sig, key, msg));
