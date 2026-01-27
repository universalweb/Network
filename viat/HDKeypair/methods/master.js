import { KEY_PURPOSE } from '../defaults.js';
import { generateEntropy } from '../entropy.js';
import { isArray } from '@universalweb/utilitylib';
export async function generateMasterNonce(size) {
	this.STATE.masterNonce = await generateEntropy(size);
	return this;
}
export async function generateMasterKey(size) {
	this.STATE.masterKey = await generateEntropy(size);
	return this;
}
export async function generateMasterSeed(size) {
	this.STATE.masterSeed = await generateEntropy(size);
	return this;
}
export default {
	generateMasterSeed,
	generateMasterKey,
	generateMasterNonce,
};
