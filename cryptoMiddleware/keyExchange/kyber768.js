import {
	clearBuffer,
	int32,
	randomBuffer
} from '#crypto';
import { isBuffer } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { shake256 } from '@noble/hashes/sha3';
const hashFunction = shake256;
const sessionKeySize = int32;
const publicKeySize = 1184;
const privateKeySize = 2400;
const seedSize = 64;
const hashSettings = {
	dkLen: 64
};
export async function encryptionKeypair(seed) {
	const kyberKeypair = ml_kem768.keygen(seed);
	return {
		publicKey: kyberKeypair.publicKey,
		privateKey: kyberKeypair.secretKey
	};
}
export async function decapsulate(cipherData, sourceKeypairKyber) {
	const decapsulated = ml_kem768.decapsulate(cipherData, sourceKeypairKyber?.privateKey || sourceKeypairKyber);
	return decapsulated;
}
export function clientSetSession(client, server, target, cipherData) {
	const sharedSecret = decapsulate(cipherData, client.privateKey);
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
export function serverSetSession(server, client, target, cipherData) {
	const sharedSecret = decapsulate(cipherData, server.privateKey);
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
export async function encapsulate(sourceKeypair) {
	// { cipherText, sharedSecret }
	const encapsulated = ml_kem768.encapsulate(sourceKeypair?.publicKey || sourceKeypair);
	return encapsulated;
}
export const kyber768 = {
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	preferred: true,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	sessionKeySize,
	ml_kem768,
	decapsulate,
	encapsulate,
	generateSeed() {
		return randomBuffer(64);
	},
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
export default kyber768;
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.privateKey.length);
// console.log(await encapsulate(keypair));
