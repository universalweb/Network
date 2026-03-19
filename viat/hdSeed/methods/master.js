import { PURPOSE } from '../defaults/index.js';
import { generateEntropy } from '../entropy.js';
import { isArray } from '@universalweb/utilitylib';
export async function generateEntropyPool(overwriteSize) {
	const size = overwriteSize || this.get('seed_size') || 128;
	const entropy = await generateEntropy(size);
	return entropy;
}
export async function generateMasterNonce(overwriteSize) {
	await this.set('master_nonce', await generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterKey(overwriteSize) {
	await this.set('master_key', await generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterSeed(overwriteSize) {
	await this.set('master_seed', await generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterSalt(overwriteSize) {
	await this.set('master_salt', await generateEntropyPool(overwriteSize));
	return this;
}
export default {
	generateMasterSalt,
	generateMasterKey,
	generateMasterNonce,
};
