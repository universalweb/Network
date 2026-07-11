/**
 * Kyber768_x25519 — hybrid X25519 + ML-KEM-768 key exchange (native node:crypto provider).
 * Composed from HybridKeyExchange + an X25519Pair (DH) and a KyberNativePair (KEM). The wire
 * public key is x25519Public(32) ‖ kyberPublic(1184); the channel holds if EITHER primitive holds.
 * Pqclean original preserved in legacy-pqclean/.
 */
import { HybridKeyExchange } from './HybridKeyExchange.js';
import { KyberNativePair } from './pairs/kyberNativePair.js';
import { X25519Pair } from './pairs/x25519Pair.js';
import { int32 } from '#utilities/cryptography/utils';
import shake256 from '../hash/shake.js';
// Split helpers over the concatenated buffer (x25519 first int32 bytes, KEM remainder)
export function getX25519Key(source) {
	return source.subarray(0, int32);
}
export function getKyberKey(source) {
	return source.subarray(int32);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, int32);
}
const algorithm = 'ml-kem-768';
export const kyber768_x25519 = new HybridKeyExchange({
	name: 'kyber768_x25519',
	alias: 'kyber768_x25519',
	description: 'X25519 with ML-KEM-768 (native) and SHAKE256.',
	id: 3,
	hash: shake256,
	dh: X25519Pair.create({}),
	kem: KyberNativePair.create({
		algorithm,
	}),
	cipherSuiteCompatibility: {
		recommended: 3,
		postQuantumRecommended: 3,
		lowestSupported: 0,
		maxSupported: 3,
		0: true,
		1: true,
		2: true,
		3: true,
	},
	speed: 0,
	security: 1,
});
export default kyber768_x25519;
/*
 * Mimics the UDSP client↔server handshake to document the packet flow + internal steps.
 * Hybrid = Kyber ONE way (client→server long-term) + x25519 TWO way (client eph × server long-term).
 * Fast auth, single round-trip. Run with `await example()`.
 */
export async function example() {
	const scheme = kyber768_x25519;
	// Random key pairs — server long-term (x25519 ‖ Kyber), client ephemeral x25519. No cert.
	const server = await scheme.keyExchangeKeypair();
	server.logInfo = console.log;
	const client = await scheme.clientEphemeralKeypair();
	client.logInfo = console.log;
	// CLIENT: derive the session off the server key pair, then stage the intro payload
	await scheme.onClientInitialization(client, server);
	// PACKET 1  client → server : x25519Public(32) ‖ kyberCiphertext(1088) = 1120 bytes
	await scheme.onClientIntroHeader(server, client, client.cipherData);
	// PACKET 2  server → client : intro reply (bare ack — the session is already established server-side)
	const serverHeader = [];
	await scheme.createServerIntro(server, client, [], serverHeader);
	await scheme.onServerIntroHeader(client, server, serverHeader[2], serverHeader);
	// Compare to confirm both sides derived the identical session
	console.log('hybrid session:', scheme.compareSessionkeysThrow(client, server));
}
// await example();
