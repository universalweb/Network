import { isBuffer, isPlainObject, isU8 } from '@universalweb/utilitylib';
/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW
	NOTE: This is overly engineered for the unknown potential of future Quantum Computers.
	NOTE: Function to generate entropy with failsafe using Kyber KEM shared secrets
	© copyright Thomas Marchi 2025
*/
import { MASTER_SEED_ENTROPY_SIZES } from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { ml_kem1024 } from '@noble/post-quantum/ml-kem.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { shake256 } from '@noble/hashes/sha3.js';
export async function generateEntropy(size = MASTER_SEED_ENTROPY_SIZES.default) {
	const randomSeed = randomBytes(size);
	const kemA = ml_kem1024.keygen();
	const kemB = ml_kem1024.keygen();
	const { sharedSecret: secretA } = ml_kem1024.encapsulate(kemA.publicKey);
	const { sharedSecret: secretB } = ml_kem1024.encapsulate(kemB.publicKey);
	const output = shake256.create({
		dkLen: size,
	}).update(randomSeed).update(secretA)
		.update(secretB)
		.digest();
	return output;
}
async function example() {
	const result = await generateEntropy(256);
	console.log(result);
	return result;
}
// example();
