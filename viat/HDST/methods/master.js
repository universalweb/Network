import { PURPOSE } from '../defaults.js';
import { generateEntropy } from '../entropy.js';
import { isArray } from '@universalweb/utilitylib';
export async function generateMasterNonce(size) {
	await this.setState('master_nonce', await generateEntropy(size));
	return this;
}
export async function generateMasterKey(size) {
	await this.setState('master_key', await generateEntropy(size));
	return this;
}
export async function generateMasterSeed(size) {
	await this.setState('master_seed', await generateEntropy(size));
	return this;
}
export default {
	generateMasterSeed,
	generateMasterKey,
	generateMasterNonce,
};
