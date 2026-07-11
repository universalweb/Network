// BLAKE2b via native node:crypto (blake2b512) — fast, zero userland deps.
// Uses the stateless one-shot crypto.hash (no per-call Hash object alloc) — materially faster than
// streaming createHash on small inputs. 256-bit digests are the 512-bit output truncated to 32
// bytes: one native primitive across the scheme. BLAKE2 permits a shorter requested output.
import cryptolib from 'node:crypto';
import { hashScheme } from './hashScheme.js';
import { int32 } from '#utilities/cryptography/utils';
const oneShotHash = cryptolib.hash;
const createHasher = cryptolib.createHash;
const hash512Name = 'blake2b512';
const outputEncoding = 'buffer';
export async function hash512(source) {
	// Bun lacks the one-shot crypto.hash — fall back to streaming there only
	if (globalThis?.Bun) {
		return createHasher(hash512Name).update(source).digest();
	}
	return oneShotHash(hash512Name, source, outputEncoding);
}
// No separate "strict" 256/512 family for BLAKE2b — the native digest already is the strict form
export async function hash512Strict(source) {
	return hash512(source);
}
export async function hash256(source) {
	const digest = await hash512(source);
	return digest.subarray(0, int32);
}
export async function hash256Strict(source) {
	const digest = await hash512(source);
	return digest.subarray(0, int32);
}
export async function hashXOF(source, outputLength = int32) {
	const digest = await hash512(source);
	return digest.subarray(0, outputLength);
}
export const blake2b = hashScheme({
	name: 'blake2b',
	alias: 'blake2b',
	id: 2,
	security: 0,
	preferred: false,
	hash256,
	hash: hash256,
	hash256Strict,
	hash512,
	hash512Strict,
	hashXOF,
});
export default blake2b;
