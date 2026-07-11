/**
 * @NAME x25519_blake3
 * @DESCRIPTION Cryptography middleware for X25519 with BLAKE3.
 */
import hash from '../hash/blake3.js';
import { x25519KeyExchange } from './X25519KeyExchange.js';
export const x25519_blake3 = x25519KeyExchange({
	name: 'x25519_blake3',
	alias: 'x25519_blake3',
	id: 0,
	hash,
});
export default x25519_blake3;
/*
 * Mimics the UDSP client↔server handshake to document the packet flow + internal steps.
 * x25519 is symmetric DH: the intro round alone lands a full mutual session — the client derives
 * against the server's public, the server derives the mirror against the client's. No ciphertext,
 * no second round needed for agreement. Run with `await example()`.
 */
export async function example() {
	const scheme = x25519_blake3;
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
	console.log('x25519_blake3 session:', scheme.compareSessionkeysThrow(client, server));
}
// await example();
