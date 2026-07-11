/*
 * Speed comparison of the three X25519 key-exchange variants — SHAKE256, BLAKE3, BLAKE2b.
 *
 * All three share the identical x25519 scalar multiplication; the ONLY difference is the
 * session-key hash backend. So we measure two things:
 *   1. The session-key hash in isolation (concatHash512 over 96B) — the true differentiator.
 *   2. The full intro handshake — real-world cost, dominated by the shared scalarmult, so the
 *      variants land close together here on purpose.
 *
 * Run directly:  node utilities/cryptography/keyExchange/x25519_compare.js
 */
import { randomBuffer } from '#utilities/cryptography/utils';
import x25519 from './x25519.js';
import x25519_blake2b from './x25519_blake2b.js';
import x25519_blake3 from './x25519_blake3.js';
// Real console.log captured before the handshake bench mutes it (the handshake logs internally)
const log = console.log;
function noop() {}
const variants = [
	x25519,
	x25519_blake3,
	x25519_blake2b,
];
// Representative session-derivation input: sharedSecret(32) ‖ clientPublic(32) ‖ serverPublic(32)
const sharedSecret = randomBuffer(32);
const clientPublicKey = randomBuffer(32);
const serverPublicKey = randomBuffer(32);
async function benchHash(scheme, iterations) {
	const hash = scheme.hash;
	for (let warm = 0; warm < 1000; warm++) {
		await hash.concatHash512(sharedSecret, clientPublicKey, serverPublicKey);
	}
	const start = performance.now();
	for (let round = 0; round < iterations; round++) {
		await hash.concatHash512(sharedSecret, clientPublicKey, serverPublicKey);
	}
	const elapsed = performance.now() - start;
	return {
		name: scheme.name,
		opsPerSec: (iterations / elapsed) * 1000,
		usPerOp: (elapsed / iterations) * 1000,
	};
}
async function runHandshake(scheme) {
	const client = await scheme.clientEphemeralKeypair();
	client.logInfo = noop;
	const server = await scheme.serverEphemeralKeypair();
	server.logInfo = noop;
	await scheme.onClientInitialization(client, server);
	await scheme.onClientIntroHeader(server, client, client.publicKey);
}
async function benchHandshake(scheme, iterations) {
	for (let warm = 0; warm < 200; warm++) {
		await runHandshake(scheme);
	}
	const start = performance.now();
	for (let round = 0; round < iterations; round++) {
		await runHandshake(scheme);
	}
	const elapsed = performance.now() - start;
	return {
		name: scheme.name,
		opsPerSec: (iterations / elapsed) * 1000,
		usPerOp: (elapsed / iterations) * 1000,
	};
}
function byOpsDescending(left, right) {
	return right.opsPerSec - left.opsPerSec;
}
function printResults(title, results) {
	results.sort(byOpsDescending);
	const fastest = results[0];
	log(`\n${title}`);
	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const relative = fastest.opsPerSec / result.opsPerSec;
		const verdict = (index === 0) ? '⚡ fastest' : `${relative.toFixed(2)}× slower`;
		log(
			result.name.padEnd(16),
			`${Math.round(result.opsPerSec).toLocaleString().padStart(13)} ops/s`,
			`${result.usPerOp.toFixed(3).padStart(8)} µs/op`,
			verdict
		);
	}
}
log('x25519 variant speed comparison — warming up…');
// 1) Session-key hash in isolation — where the variants actually diverge
const hashResults = [];
for (let index = 0; index < variants.length; index++) {
	hashResults.push(await benchHash(variants[index], 200000));
}
printResults('Session-key hash · concatHash512 over 96B (isolates the hash backend):', hashResults);
// 2) Full intro handshake — mute the schemes' internal logging so I/O does not skew timing
console.log = noop;
const handshakeResults = [];
for (let index = 0; index < variants.length; index++) {
	handshakeResults.push(await benchHandshake(variants[index], 10000));
}
console.log = log;
printResults('Full intro handshake · onClientInitialization + onClientIntroHeader (scalarmult-bound):', handshakeResults);
log('\nNotes:');
log('• The handshake is dominated by the shared x25519 scalar multiplication, so all three converge.');
log('• blake2b tends to edge the full handshake because crypto_kx folds the scalarmult + BLAKE2b KDF');
log('  into ONE native call, while shake/blake3 do scalarmult (sodium) then hash (JS) as two hops.');
log('• The hash microbench reflects the hashScheme backends directly — what shake/blake3 use in the');
log('  intro, and what every variant uses for the PFS key-upgrade combine.');
