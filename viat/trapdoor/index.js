import { HASH_ALGORITHMS, trapdoorTypes } from '#viat/defaults';
import { encode, encodeStrictSync } from '#utilities/serialize';
import { hasValue, isString } from '@universalweb/utilitylib';
import { hash256 } from '#crypto/hash/shake.js';
/*
	Version must match version in the original wallet
	NOTE: Future trapdoors will have additional parameters in plain CBOR to support different trapdoor types but same trapdoor hash size
	NOTE: To support many algos and be safe the modular trapdoor must have values in plain text to offset collision risks
	NOTE for now v1 will be just the hash and the algo will be assumed dilithium with a set level of security
*/
export async function generateTrapdoorStruct(publicKey, kind, cipher, version, script) {
	const source = [
		kind,
		version,
		cipher,
		publicKey,
	];
	return source;
}
async function legacyTrapdoor(publicKey) {
	const hashed = await hash256(publicKey);
	return hashed;
}
// NOTE: Script isn't used yet but reserved for future use cases
// NOTE: Modular trapdoors for future addresses
async function trapdoor(publicKey, kindArg, cipher = 0, version = 0, script) {
	const kind = isString(kindArg) ? (trapdoorTypes[kindArg] || 0) : trapdoorTypes.signature;
	const struct = await generateTrapdoorStruct(publicKey, kind, cipher, version, script);
	const domained = await encode(struct);
	const hashed = await hash256(domained);
	const finalize = await encode([
		kind, version, cipher, hashed,
	]);
	return finalize;
}
