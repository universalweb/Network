import { CONTEXT, KEY_PURPOSES, MASTER_SEED_ENTROPY_SIZES } from './defaults.js';
/*
	THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW
	Hierarchal Deterministic Wallet Generation - It's still safer to generate many separate keys instead of from a single seed
	c copyright Thomas Marchi 2025
*/
import { decodeSync, encode, encodeStrict } from '#utilities/serialize';
import { hash256, hashXOF } from '#crypto/hash/shake.js';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import aegis256 from '#cipher/AEGIS256';
import { assign } from '@universalweb/utilitylib';
import { clearBuffer } from '#crypto/utils.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
/*
	NOTE: This is overly engineered for the unknown potential of future Quantum Computers and to impose more problems to QCs in the event of failure.
	NOTE: The 256 byte output is also to maximize the sponge functions security margins SEE FIPS 202 FOR MORE DETAILS
	NOTE: This method also allows for classical pub key generation and once QC compromised won't be able to just generate all keys, nonces, and then seeds (currently theoretical but unlikely initially for quite some time) This can be further mitigated by removing deterministic bytes from the random source
*/
function generateSecretKeyBasic(size, hashSize) {
	return hashXOF(randomBytes(size), hashSize || size);
}
// Function to generate a super high entropy throwaway seed
export async function generateEntropy(size, source = {}) {
	const randomSeed = generateSecretKeyBasic(size || MASTER_SEED_ENTROPY_SIZES.default);
	const kemA = ml_kem1024.keygen();
	const kemB = ml_kem1024.keygen();
	const { sharedSecret: secretA } = ml_kem1024.encapsulate(kemA.publicKey);
	const { sharedSecret: secretB } = ml_kem1024.encapsulate(kemB.publicKey);
	assign(source, {
		seed: randomSeed,
		secretA,
		secretB,
	});
	const domain = await encodeStrict(source);
	return hashXOF(domain, size || MASTER_SEED_ENTROPY_SIZES.default);
}
export async function generateMasterKeySeed(size, source = {}) {
	if (!source.length) {
		source.context = CONTEXT.SECRET_KEY;
		source.kind = KEY_PURPOSES.SECRET_KEY;
	}
	return generateEntropy(size, source);
}
export async function generateMasterNonceSeed(size, source = {}) {
	if (!source.length) {
		source.context = CONTEXT.SECRET_NONCE;
		source.kind = KEY_PURPOSES.NONCE;
	}
	return generateEntropy(size, source);
}
export default {
	generateEntropy,
	generateMasterKeySeed,
	generateMasterNonceSeed,
};
