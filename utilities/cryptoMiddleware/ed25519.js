import { bufferAlloc, randomBuffer } from '../crypto.js';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_keypair,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_server_session_keys,
	crypto_kx_SESSIONKEYBYTES,
	crypto_sign,
	crypto_sign_BYTES,
	crypto_sign_detached,
	crypto_sign_keypair,
	crypto_sign_open,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
	crypto_sign_verify_detached,
	crypto_box_seal,
	crypto_box_SEALBYTES,
	crypto_box_seal_open,
	crypto_box_keypair,
	crypto_box_PUBLICKEYBYTES,
	crypto_box_SECRETKEYBYTES,
	crypto_secretbox_easy,
	crypto_secretbox_MACBYTES,
	crypto_secretbox_NONCEBYTES,
	crypto_secretbox_KEYBYTES,
	crypto_sign_ed25519_pk_to_curve25519,
	crypto_sign_ed25519_sk_to_curve25519,
	crypto_sign_ed25519_sk_to_pk,
	crypto_sign_ed25519_sk_to_seed,
	crypto_sign_SEEDBYTES,
	crypto_kx_seed_keypair,
	crypto_box_easy,
	crypto_box_open_easy,
	crypto_box_NONCEBYTES,
	crypto_box_MACBYTES
} = sodiumLib;
export function sign(message, privateKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, privateKey?.privateKey || privateKey);
	return signedMessage;
}
export function signDetached(message, privateKey) {
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
export function signatureKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, privateKey);
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
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalPublicKey);
	return publicKey;
}
export function signaturePrivateKeyToEncryptPrivateKey(originalPrivateKey) {
	const privateKey = bufferAlloc(crypto_box_SECRETKEYBYTES);
	crypto_sign_ed25519_sk_to_curve25519(privateKey, originalPrivateKey);
	return privateKey;
}
export function signatureKeypairToEncryptionKeypair(originalKeypair) {
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalKeypair.publicKey);
	const result = {
		publicKey
	};
	if (originalKeypair.privateKey) {
		const privateKey = bufferAlloc(crypto_box_SECRETKEYBYTES);
		crypto_sign_ed25519_sk_to_curve25519(privateKey, originalKeypair.privateKey);
		result.privateKey = privateKey;
	}
	return result;
}
export function getSignaturePublicKeyFromPrivateKey(privateKey) {
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_sk_to_pk(publicKey, privateKey);
	return publicKey;
}
export const ed25519Algo = {
	name: 'ed25519',
	alias: 'default',
	id: 0,
	signatureKeypair,
	sign,
	verifySignature,
	signDetached,
	signaturePrivateKeyToEncryptPrivateKey,
	signaturePublicKeyToEncryptPublicKey,
	signatureKeypairToEncryptionKeypair,
	getSignaturePublicKeyFromPrivateKey,
	verifySignatureDetached,
	hash: blake3,
	preferred: true
};
