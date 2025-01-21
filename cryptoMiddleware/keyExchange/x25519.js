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
import { shake256 } from '@noble/hashes/sha3';
const hashFunction = shake256;
const keyAlgorithm = curve25519.x25519;
const generatePrivateKey = keyAlgorithm.utils.randomPrivateKey;
const generatePublicKey = keyAlgorithm.getPublicKey;
const publicKeySize = int32;
const privateKeySize = int32;
const sessionKeySize = int32;
const hashSettings = {
	dkLen: 64
};
export function encryptionKeypair(source, cleanFlag) {
	const privateKey = generatePrivateKey();
	const publicKey = generatePublicKey(privateKey);
	if (source) {
		source.publicKey = publicKey;
		source.privateKey = privateKey;
		return source;
	}
	return {
		publicKey,
		privateKey
	};
}
export function clientSetSession(client, server, target) {
	const sharedSecret = curve25519.x25519.getSharedSecret(client?.privateKey || client, server?.publicKey || server);
	const hashSharedSecret = hashFunction(Buffer.concat([
		sharedSecret,
		client.publicKey,
		server?.publicKey || server
	]), hashSettings);
	const transmitKey = hashSharedSecret.subarray(sessionKeySize);
	const receiveKey = hashSharedSecret.subarray(0, sessionKeySize);
	if (target) {
		target.sharedSecret = hashSharedSecret;
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		sharedSecret: hashSharedSecret,
		receiveKey,
		transmitKey
	};
}
export async function clientSetSessionAttach(source, destination) {
	return clientSetSession(source, destination, source);
}
export function serverSetSession(server, client, target) {
	const sharedSecret = curve25519.x25519.getSharedSecret(server?.privateKey || server, client?.publicKey || client);
	const hashSharedSecret = hashFunction(Buffer.concat([
		sharedSecret,
		client?.publicKey || client,
		server.publicKey
	]), hashSettings);
	const transmitKey = hashSharedSecret.subarray(0, sessionKeySize);
	const receiveKey = hashSharedSecret.subarray(sessionKeySize);
	if (target) {
		target.sharedSecret = hashSharedSecret;
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		sharedSecret: hashSharedSecret,
		receiveKey,
		transmitKey
	};
}
export async function serverSetSessionAttach(source, destination) {
	return serverSetSession(source, destination, source);
}
export const x25519 = {
	name: 'x25519',
	alias: 'x25519',
	id: 0,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	sessionKeySize,
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
