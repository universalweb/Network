/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW
	NOTE: This is overly engineered for the unknown potential of future Quantum Computers.
	NOTE: In the future more entropy sources need to be added to ensure a high entropy for larger 128+ byte pools.
	© copyright Thomas Marchi 2025
*/
import { encode, hash, hashInstance } from './utils.js';
import { isPlainObject, isTypedArray, isU8 } from '@universalweb/utilitylib';
import { MASTER_ENTROPY_POOL_SIZES } from './defaults/index.js';
import { getFingerprintEntropy } from './entropy/fingerprint.js';
import { keccakprg } from '@noble/hashes/sha3-addons.js';
import { ml_kem1024 } from '@noble/post-quantum/ml-kem.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
const KECCAK_PRG_CAPACITY = 510;
export async function spongeEntropy(size = MASTER_ENTROPY_POOL_SIZES.MAX, capacity = KECCAK_PRG_CAPACITY) {
	const spongeRandom = keccakprg(capacity);
	spongeRandom.update(randomBytes(size));
	return spongeRandom.randomBytes(size);
}
export async function generateEntropy(outputSize = MASTER_ENTROPY_POOL_SIZES.DEFAULT, sourceSize = 256, sources) {
	const randomSeed = randomBytes(sourceSize);
	const kemA = await ml_kem1024.keygen();
	const kemB = await ml_kem1024.keygen();
	const { sharedSecret: secretA } = await ml_kem1024.encapsulate(kemA.publicKey);
	const { sharedSecret: secretB } = await ml_kem1024.encapsulate(kemB.publicKey);
	const fingerprintEntropy = await getFingerprintEntropy(MASTER_ENTROPY_POOL_SIZES.DEFAULT);
	const spongeRandom = await spongeEntropy(sourceSize);
	const instance = await hashInstance(sourceSize);
	instance.update(randomSeed)
		.update(secretA)
		.update(secretB)
		.update(spongeRandom)
		.update(fingerprintEntropy);
	if (sources?.length) {
		sources.forEach((source) => {
			if (isTypedArray(source)) {
				instance.update(source);
			}
		});
	}
	const entropyPool = await instance.digest();
	return hash(entropyPool, outputSize);
}
async function example() {
	const result = await generateEntropy(64);
	console.log('Sponge Entropy', await spongeEntropy());
	console.log('Generate Entropy', result);
	console.log('getFingerprintEntropy', await getFingerprintEntropy());
	return result;
}
// example();

