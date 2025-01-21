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
import { assign } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
import { x25519 } from './x25519.js';
const hashFunction = blake3;
const keyAlgorithm = curve25519.x25519;
export function clientSetSession(client, server, target) {
	return x25519.clientSetSession(client, server, target, hashFunction);
}
export async function clientSetSessionAttach(source, destination) {
	return clientSetSession(source, destination, source);
}
export function serverSetSession(server, client, target) {
	return x25519.serverSetSession(client, server, target, hashFunction);
}
export async function serverSetSessionAttach(source, destination) {
	return serverSetSession(source, destination, source);
}
const x25519_blake3 = {};
assign(x25519_blake3, x25519);
assign(x25519_blake3, {
	name: 'x25519_blake3',
	alias: 'x25519_blake3',
	id: 4,
	clientSetSession,
	clientSetSessionAttach,
	serverSetSession,
	serverSetSessionAttach
});
export default x25519_blake3;
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.publicKey.length);
