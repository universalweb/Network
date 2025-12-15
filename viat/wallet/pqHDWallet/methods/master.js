import { KEY_PURPOSES } from '../defaults.js';
import { isArray } from '@universalweb/utilitylib';
export async function generateMasterNonce(size, structure = {}) {
	this.info.masterNonce = await this.generateMasterNonceSeed(size, structure);
}
export async function generateMasterKey(size, structure = {}) {
	this.info.masterKey = await this.generateMasterKeySeed(size, structure);
}
export async function generateMasterSeed(config = {}, source = {}) {
	await this.generateDomain(config, source);
	await this.generateSeedStruct(config, source);
	await this.generateMasterSeedStruct(config, source);
	this.describeObject(source);
	console.log('generateMasterSeed struct', source);
	const encoded = await this.normalizeSeed(source);
	this.info.masterSeed = await this.encrypt(
		encoded,
		this.info.masterKey,
		this.info.masterNonce
	);
	console.log('generateMasterSeed', this.info.masterSeed.length);
	const errors = await this.validateSeedObject(source);
	if (isArray(errors)) {
		return errors;
	}
	return source;
}
export async function generateMasterSeedStruct(config, source = {}) {
	console.log('generateMasterSeedStruct result', source);
	source.seed = await this.generateEntropy();
	source.kind = KEY_PURPOSES.MASTER;
	source.id = 0;
	return source;
}
export default {
	generateMasterSeed,
	generateMasterKey,
	generateMasterNonce,
	generateMasterSeedStruct,
};
