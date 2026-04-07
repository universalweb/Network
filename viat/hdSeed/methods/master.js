import { PURPOSE } from '../defaults/index.js';
import { generateEntropy } from '../entropy.js';
import { isArray } from '@universalweb/utilitylib';
export async function generateEntropyPool(overwriteSize) {
	const stateSeedSize = await this.get('seed_size');
	const size = overwriteSize || stateSeedSize || 128;
	const entropy = await generateEntropy(size);
	return entropy;
}
export async function generateMasterNonce(overwriteSize) {
	await this.set('master_nonce', await this.generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterKey(overwriteSize) {
	await this.set('master_key', await this.generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterSeed(overwriteSize) {
	await this.set('master_seed', await this.generateEntropyPool(overwriteSize));
	return this;
}
export async function generateMasterSalt(overwriteSize) {
	await this.set('master_salt', await this.generateEntropyPool(overwriteSize));
	return this;
}
export async function createMasterSeeds() {
	await this.generateMasterKey();
	await this.generateMasterNonce();
	await this.generateMasterSeed();
	await this.generateMasterSalt();
	return this;
}
export default {
	generateMasterSalt,
	generateMasterKey,
	generateMasterNonce,
	generateMasterSeed,
	generateEntropyPool,
	createMasterSeeds,
};
