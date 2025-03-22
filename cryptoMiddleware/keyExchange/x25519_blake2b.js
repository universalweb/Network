// (sodium-native) native bindings to libsodium
// Avoid in favor of blake3 this is left for archival purposes
import { bufferAlloc, int32, randomBuffer } from '#crypto';
import {
	crypto_kx_client_session_keys,
	crypto_kx_keypair,
	crypto_kx_server_session_keys,
	crypto_scalarmult
} from '#utilities/sodium';
const publicKeySize = int32;
const privateKeySize = int32;
const sessionKeySize = int32;
function getSharedSecret(source, destination) {
	const sharedSecret = bufferAlloc(32);
	console.log('Shared Secret', sharedSecret, source, destination);
	crypto_scalarmult(sharedSecret, source?.privateKey || source, destination?.publicKey || destination);
	return sharedSecret;
}
export function keyExchangeKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(publicKeySize);
	const privateKey = config?.privateKey || bufferAlloc(privateKeySize);
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
	const receiveKey = client?.receiveKey || bufferAlloc(sessionKeySize);
	const transmitKey = client?.transmitKey || bufferAlloc(sessionKeySize);
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
	const receiveKey = server?.receiveKey || bufferAlloc(sessionKeySize);
	const transmitKey = server?.transmitKey || bufferAlloc(sessionKeySize);
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
export const x25519_blake2b = {
	name: 'x25519_blake2b',
	alias: 'x25519_blake2b',
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
	keyExchangeKeypair,
	certificateEncryptionKeypair: keyExchangeKeypair,
};
export default x25519_blake2b;
// const cl = await x25519_blake2b.keyExchangeKeypair();
// const sr = await x25519_blake2b.keyExchangeKeypair();
// console.log(cl, sr);
// const ss = await getSharedSecret(cl, sr);
// console.log(ss);
// const hashSharedSecret = Buffer.from(await b2(Buffer.concat([
// 	ss,
// 	cl?.publicKey,
// 	sr?.publicKey
// ]), 512), 'hex');
// // Client Transmit 32 - receiveKey 0, 32
// console.log(hashSharedSecret.subarray(32), hashSharedSecret.subarray(0, 32));
// console.log(await x25519_blake2b.clientSetSessionAttach(cl, sr));
// // Server Transmit 0,32 - receiveKey is 32
// console.log(await x25519_blake2b.serverSetSessionAttach(sr, cl));
