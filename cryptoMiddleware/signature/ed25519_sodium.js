import {
	bufferAlloc,
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_sign,
	crypto_sign_BYTES,
	crypto_sign_detached,
	crypto_sign_keypair,
	crypto_sign_open,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
	crypto_sign_verify_detached,
	crypto_sign_ed25519_pk_to_curve25519,
	crypto_sign_ed25519_sk_to_curve25519,
	crypto_sign_ed25519_sk_to_pk,
	crypto_sign_ed25519_sk_to_seed,
	crypto_sign_SEEDBYTES,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES
} = sodiumLib;
const generateKeypair = crypto_sign_keypair;
const publicKeySize = crypto_sign_PUBLICKEYBYTES;
const privateKeySize = crypto_sign_SECRETKEYBYTES;
const signatureSize = crypto_sign_BYTES;
const seedSize = crypto_sign_SEEDBYTES;
export function signCombined(message, privateKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, privateKey?.privateKey || privateKey);
	return signedMessage;
}
export function sign(message, privateKey) {
	const signature = bufferAlloc(crypto_sign_BYTES);
	crypto_sign_detached(signature, message, privateKey?.privateKey || privateKey);
	return signature;
}
export function verifySignature(signedMessage, publicKey) {
	const message = bufferAlloc(signedMessage.length - crypto_sign_BYTES);
	const verify = crypto_sign_open(message, signedMessage, publicKey?.publicKey || publicKey);
	return verify && message;
}
export function verifySignatureDetached(signedMessage, publicKey, message) {
	return crypto_sign_verify_detached(signedMessage, message, publicKey?.publicKey || publicKey);
}
export async function signatureKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_sign_SECRETKEYBYTES);
	generateKeypair(publicKey, privateKey);
	if (config) {
		config.publicKey = publicKey;
		config.privateKey = privateKey;
		return config;
	}
	return {
		publicKey,
		privateKey
	};
}
export function signaturePublicKeyToEncryptPublicKey(originalPublicKey) {
	const publicKey = bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalPublicKey);
	return publicKey;
}
export function signaturePrivateKeyToEncryptPrivateKey(originalPrivateKey) {
	const privateKey = bufferAlloc(crypto_kx_SECRETKEYBYTES);
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
export function getPublicKeyFromPrivateKey(privateKey) {
	const publicKey = bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	crypto_sign_ed25519_sk_to_pk(publicKey, privateKey);
	return publicKey;
}
export const ed25519_sodium = {
	name: 'ed25519_sodium',
	alias: 'ed25519_sodium',
	id: 6,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	signatureKeypair,
	sign,
	verifySignature,
	signCombined,
	signaturePrivateKeyToEncryptPrivateKey,
	signaturePublicKeyToEncryptPublicKey,
	signatureKeypairToEncryptionKeypair,
	getPublicKeyFromPrivateKey,
	verifySignatureDetached,
	hash: blake3,
	preferred: true
};
// const key = await signatureKeypair();
// console.log(sign(Buffer.from('hello world'), key));
