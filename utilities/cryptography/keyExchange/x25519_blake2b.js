/**
 * @NAME x25519_blake2b
 * @DESCRIPTION X25519 key exchange whose session keys are derived by libsodium's native crypto_kx —
 * which internally is BLAKE2b-512( scalarmult(sk,pk) ‖ clientPublic ‖ serverPublic ) split into the
 * rx/tx pair. That makes this the fastest, fully-native BLAKE2b path: the scalar multiplication and
 * the key-derivation hash happen in a single C call. The libsodium KX is wrapped in the modern
 * X25519KeyExchange handshake surface so the API matches x25519 / x25519_blake3 exactly, and the
 * blake2b hash module backs any hash-combine (PFS key upgrade) step.
 */
import {
	bufferAlloc,
	int32,
} from '#utilities/cryptography/utils';
import {
	crypto_kx_client_session_keys,
	crypto_kx_server_session_keys,
} from '#utilities/cryptography/sodium';
import { X25519KeyExchange } from './X25519KeyExchange.js';
import hash from '../hash/blake2b.js';
const sessionKeySize = int32;
export class X25519Blake2bKeyExchange extends X25519KeyExchange {
	/*
	 * Native KX session derivation. libsodium runs the X25519 and the BLAKE2b KDF in one call and
	 * guarantees the orientation client.rx === server.tx and client.tx === server.rx, which is exactly
	 * what compareSessionkeys checks — so no manual scalarmult or hashing is needed for the intro.
	 */
	createClientSession(client, server, target = client) {
		const receiveKey = bufferAlloc(sessionKeySize);
		const transmitKey = bufferAlloc(sessionKeySize);
		crypto_kx_client_session_keys(receiveKey, transmitKey, client.publicKey, client.privateKey, server.publicKey);
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	createServerSession(server, client, target = server) {
		const receiveKey = bufferAlloc(sessionKeySize);
		const transmitKey = bufferAlloc(sessionKeySize);
		crypto_kx_server_session_keys(receiveKey, transmitKey, server.publicKey, server.privateKey, client.publicKey);
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	// Same handshake method names as X25519KeyExchange — crypto_kx already folds in the scalarmult,
	// so we skip the base class's separate getSharedSecret step.
	async onClientInitialization(source, destination) {
		this.createClientSession(source, destination, source);
	}
	async onClientIntroHeader(source, destination, cipherData, header) {
		destination.publicKey = cipherData;
		this.createServerSession(source, destination, source);
	}
}
export function x25519Blake2bKeyExchange(config) {
	return new X25519Blake2bKeyExchange(config);
}
export const x25519_blake2b = x25519Blake2bKeyExchange({
	name: 'x25519_blake2b',
	alias: 'x25519_blake2b',
	id: 0,
	hash,
});
export default x25519_blake2b;
/*
 * Mimics the UDSP client↔server handshake to document the packet flow + internal steps.
 * x25519 is symmetric DH: the intro round alone lands a full mutual session — the client derives
 * against the server's public, the server derives the mirror against the client's. No ciphertext,
 * no second round needed for agreement. Run with `await example()`.
 */
export async function example() {
	const scheme = x25519_blake2b;
	// Random key pairs — client ephemeral, server long-term. Straight to the handshake, no cert.
	const client = await scheme.clientEphemeralKeypair();
	client.logInfo = console.log;
	const server = await scheme.serverEphemeralKeypair();
	server.logInfo = console.log;
	// CLIENT: derive the session against the server public, then stage the intro (its own public key)
	await scheme.onClientInitialization(client, server);
	// PACKET 1  client → server : clientPublic(32)
	await scheme.onClientIntroHeader(server, client, client.publicKey);
	// Both sides now hold the identical session — confirm.
	console.log('x25519_blake2b session:', scheme.compareSessionkeysThrow(client, server));
}
// await example();
