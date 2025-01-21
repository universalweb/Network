// OLDER VERSION USING libSodium (sodium-native) which uses Blake2b by default
// NOT IN USE FOR ARCHIVE ONLY
import { bufferAlloc, randomBuffer } from '#utilities/crypto';
import { createSessionKey } from '../encryption/XChaCha.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_keypair,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_server_session_keys,
	crypto_kx_SESSIONKEYBYTES,
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
export function clientSetSession(client, serverPublicKey, target) {
	const receiveKey = client?.receiveKey || createSessionKey();
	const transmitKey = client?.transmitKey || createSessionKey();
	crypto_kx_client_session_keys(receiveKey, transmitKey, client.publicKey, client.privateKey, serverPublicKey?.publicKey || serverPublicKey);
	if (target) {
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	if (client.receiveKey) {
		return client;
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
	if (server.receiveKey) {
		return server;
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
const publicKeySize = crypto_kx_PUBLICKEYBYTES;
const privateKeySize = crypto_kx_SECRETKEYBYTES;
export function getX25519Key(source) {
	return source.subarray(0, crypto_kx_PUBLICKEYBYTES);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, crypto_kx_PUBLICKEYBYTES);
}
export function getX25519Keypair(source) {
	return {
		publicKey: getX25519Key(source.publicKey),
		privateKey: getX25519Key(source.privateKey)
	};
}
export const x25519_sodium = {
	name: 'x25519_sodium',
	alias: 'x25519_sodium',
	id: 5,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	serverSetSessionAttach,
	clientSetSession,
	serverSetSession,
	preferred: true,
	clientSetSessionAttach,
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
export default x25519_sodium;
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.publicKey.length);
