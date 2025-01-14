/**
 * @NAME x25519_blake3
 * @DESCRIPTION Cryptography middleware for X25519 with BLAKE3.
 * The shared secret is hashed with BLAKE3 to a 512bit (64 byte) output & then is split into two 32 byte session keys.
 */
import * as curve25519 from '@noble/curves/ed25519';
import {
	bufferAlloc,
	clearBuffer,
	int32,
	randomBuffer,
	randomize
} from '#utilities/crypto';
import { blake3 } from '@noble/hashes/blake3';
const hashFunction = blake3;
const keyAlgorithm = curve25519.x25519;
const generatePrivateKey = keyAlgorithm.utils.randomPrivateKey;
const generatePublicKey = keyAlgorithm.getPublicKey;
const publicKeySize = int32;
const privateKeySize = int32;
const keySize = int32;
const hashSettings = {
	dkLen: 64
};
export function encryptionKeypair(source, cleanFlag) {
	const privateKey = (source?.privateKey) ? randomize(source.privateKey) : generatePrivateKey();
	const publicKey = generatePublicKey(privateKey);
	if (source) {
		if (source.publicKey) {
			clearBuffer(source.publicKey);
			source.publicKey = null;
		}
		source.publicKey = publicKey;
		source.privateKey = privateKey;
		return source;
	}
	return {
		publicKey,
		privateKey
	};
}
export function clearSession(source) {
	if (source.sharedSecret) {
		clearBuffer(source.sharedSecret);
		source.receiveKey = null;
	}
	if (source.receiveKey) {
		clearBuffer(source.receiveKey);
		source.receiveKey = null;
	}
	if (source.transmitKey) {
		clearBuffer(source.transmitKey);
		source.transmitKey = null;
	}
	return source;
}
export function cleanKeypair(source) {
	if (source.publicKey) {
		clearBuffer(source.publicKey);
		source.publicKey = null;
	}
	if (source.privateKey) {
		clearBuffer(source.privateKey);
		source.privateKey = null;
	}
	return source;
}
export function clientSetSession(client, server, target) {
	const sharedsecret = curve25519.x25519.getSharedSecret(client?.privateKey || client, server?.publicKey || server);
	const sharedSecret = hashFunction(Buffer.concat([
		sharedsecret,
		client.publicKey,
		server?.publicKey || server
	]), hashSettings);
	const transmitKey = sharedSecret.subarray(keySize);
	const receiveKey = sharedSecret.subarray(0, keySize);
	if (target) {
		target.sharedSecret = sharedSecret;
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		sharedSecret,
		receiveKey,
		transmitKey
	};
}
export async function clientSetSessionAttach(source, destination) {
	return clientSetSession(source, destination, source);
}
export function serverSetSession(server, client, target) {
	const sharedsecret = curve25519.x25519.getSharedSecret(server?.privateKey || server, client?.publicKey || client);
	const sharedSecret = hashFunction(Buffer.concat([
		sharedsecret,
		client?.publicKey || client,
		server.publicKey
	]), hashSettings);
	const transmitKey = sharedSecret.subarray(0, keySize);
	const receiveKey = sharedSecret.subarray(keySize);
	if (target) {
		target.sharedSecret = sharedSecret;
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		sharedSecret,
		receiveKey,
		transmitKey
	};
}
export async function serverSetSessionAttach(source, destination) {
	return serverSetSession(source, destination, source);
}
export function getX25519Key(source) {
	return source.subarray(0, int32);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, int32);
}
export function getX25519Keypair(source) {
	return {
		publicKey: getX25519Key(source.publicKey),
		privateKey: getX25519Key(source.privateKey)
	};
}
export const x25519 = {
	name: 'x25519',
	alias: 'x25519_blake3',
	id: 0,
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
export default x25519;
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.publicKey.length);
