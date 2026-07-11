import { createKyberNative } from './kyberNative.js';
// ML-KEM-768 key exchange — native node:crypto provider (pqclean retired; original in legacy-pqclean/)
export const algorithm = 'ml-kem-768';
export const kyber768 = createKyberNative({
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	preferred: true,
	algorithm,
});
export default kyber768;
/*
 * Mimics the UDSP client↔server handshake to document the packet flow + internal steps.
 * Full Kyber is TWO-way KEM: way #1 = server encapsulates to the client's ephemeral (intro);
 * way #2 = client encapsulates to the server's long-term (extended synchronization / PFS upgrade).
 * `client` and `server` hold each party's connection state. Run with `await example()`.
 */
export async function example() {
	const scheme = kyber768;
	// Random key pairs — client ephemeral, server long-term. Straight to the handshake, no cert.
	const client = await scheme.clientEphemeralKeypair();
	client.logInfo = console.log;
	const server = await scheme.serverEphemeralKeypair();
	server.logInfo = console.log;
	// WAY 1 (intro) — server encapsulates to the client's ephemeral KEM public; client decapsulates.
	// PACKET 1  client → server : clientKyberPublic(1184)   PACKET 2  server → client : kyberCipher(1088)
	await scheme.onClientIntroHeader(server, client, client.publicKeyBuffer);
	await scheme.onServerIntroHeader(client, server, server.cipherData);
	console.log('intro (way 1):', scheme.compareSessionkeysThrow(client, server));
	// WAY 2 (extended sync) — client encapsulates to the server's long-term KEM public; both upgrade.
	const extendedHeader = [];
	await scheme.onCreateClientExtendedSynchronization(client, server, [], extendedHeader);
	await scheme.serverExtendedSynchronizationHeader(server, client, [], extendedHeader);
	await scheme.clientExtendedSynchronizationHeader(client, server, extendedHeader, {});
	console.log('upgraded (way 2):', scheme.compareSessionkeysThrow(client, server));
}
// await example();
