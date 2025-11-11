import { encode } from '#utilities/serialize';
import { hash256 } from '#crypto/hash/shake256.js';
/*
	Version must match version in the original wallet
	Kind must be 1 for trapdoors
	NOTE: Future trapdoors will have additional parameters in plain CBOR to support different trapdoor types but same trapdoor hash size
	NOTE: To support many algos and be safe the modular trapdoor must have values in plain text to offset collision risks
	NOTE for now v1 will be just the hash and the algo will be assumed dilithium with a set level of security
*/
export async function generateTrapdoorStruct(publicKey, cipher = '0', version = '0') {
	const kind = '1';
	const source = [
		kind,
		version,
		cipher,
		publicKey,
	];
	return source;
}
async function trapdoor(publicKey, cipher = '0', version = '0') {
	const struct = await generateTrapdoorStruct(publicKey, cipher, version);
	const domained = await encode(struct);
	const hashed = await hash256(domained);
	return hashed;
}
async function modularTrapdoor(publicKey, cipher = '0', version = '0') {
	const struct = await generateTrapdoorStruct(publicKey, cipher, version);
	const domained = await encode(struct);
	const hashed = await hash256(domained);
	const finalize = await encode([
		version, cipher, hashed,
	]);
	return finalize;
}
