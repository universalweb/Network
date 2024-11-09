import { bufferAlloc, randomBuffer } from '#utilities/crypto';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { createSessionKey } from '../encryption/XChaCha.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_keypair,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_server_session_keys,
	crypto_kx_SESSIONKEYBYTES,
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
	crypto_kx_seed_keypair,
	crypto_box_easy,
	crypto_box_open_easy,
	crypto_box_NONCEBYTES,
	crypto_box_MACBYTES,
	crypto_kx_client_session_keys
} = sodiumLib;
export function encryptionKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, privateKey);
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
export function keypairSeed(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_seed_keypair(publicKey, privateKey, config.seed);
	return {
		publicKey,
		privateKey
	};
}
export function cryptoBoxKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_box_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_box_SECRETKEYBYTES);
	crypto_box_keypair(publicKey, privateKey);
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
export function boxSeal(message, destinationKeypair) {
	const encrypted = bufferAlloc(message.length + crypto_box_SEALBYTES);
	crypto_box_seal(encrypted, message, destinationKeypair?.publicKey || destinationKeypair);
	return encrypted;
}
export function boxUnseal(encrypted, destinationKeypair) {
	const message = bufferAlloc(encrypted.length - crypto_box_SEALBYTES);
	const isValid = crypto_box_seal_open(message, encrypted, destinationKeypair.publicKey, destinationKeypair.privateKey);
	return isValid && message;
}
export function secretBoxNonce() {
	return randomBuffer(crypto_secretbox_NONCEBYTES);
}
export function authBoxNonce() {
	return randomBuffer(crypto_box_NONCEBYTES);
}
export function authenticatedBoxOpen(encrypted, receiverKeypair, senderKeypair) {
	const encryptedPayloadLength = encrypted.length;
	const nonce = encrypted.subarray(0, crypto_box_NONCEBYTES);
	const encryptedMessage = encrypted.subarray(crypto_box_NONCEBYTES, encryptedPayloadLength);
	const message = bufferAlloc(encryptedMessage.length - crypto_box_MACBYTES);
	const sender = senderKeypair?.publicKey || senderKeypair;
	const receiver = receiverKeypair?.privateKey || receiverKeypair;
	crypto_box_open_easy(message, encryptedMessage, nonce, receiver, sender);
	return message;
}
export function authenticatedBox(message, receiverKeypair, senderKeypair) {
	const nonce = authBoxNonce();
	const encrypted = bufferAlloc(message.length + crypto_box_MACBYTES);
	const sender = senderKeypair?.publicKey || senderKeypair;
	const receiver = receiverKeypair?.privateKey || receiverKeypair;
	crypto_box_easy(encrypted, message, nonce, receiver, sender);
	return Buffer.concat([
		nonce,
		encrypted
	]);
}
export function clientSetSession(client, serverPublicKey, target) {
	const receiveKey = client?.receiveKey || createSessionKey();
	const transmitKey = client?.transmitKey || createSessionKey();
	crypto_kx_client_session_keys(receiveKey, transmitKey, client.publicKey, client.privateKey, serverPublicKey?.publicKey || serverPublicKey);
	if (target) {
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		receiveKey,
		transmitKey
	};
}
export function serverSetSession(server, client, target) {
	const receiveKey = server?.receiveKey || createSessionKey();
	const transmitKey = server?.transmitKey || createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, server.publicKey, server.privateKey, client?.publicKey || client);
	if (target) {
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		receiveKey,
		transmitKey
	};
}
export async function serverSetSessionAttach(source, destination) {
	return serverSetSession(source, destination, source);
}
export async function clientSetSessionAttach(source, destination) {
	return clientSetSession(source, destination, source);
}
export const x25519 = {
	name: 'x25519',
	alias: 'x25519',
	id: 0,
	cipherSuites: [
		0,
		1
	],
	serverSetSessionAttach,
	clientSetSession,
	serverSetSession,
	preferred: true,
	clientSetSessionAttach,
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
