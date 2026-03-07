import {
	CONTEXT, OBJECT_TYPE,
	PURPOSE,
} from '../defaults.js';
import { noValue } from '@universalweb/utilitylib';
export async function setStructDefaults(source) {
	source.hash_algorithm = this.STATE.get('hash_algorithm');
	source.keyed_hash_algorithm = this.STATE.get('keyed_hash_algorithm');
	if (noValue(source.PURPOSE)) {
		source.PURPOSE = PURPOSE.SIGN;
	}
}
export async function generatePreSeedStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_SEED;
	source.context = CONTEXT.SEED;
	source.seed = this.STATE.get('master_seed');
	console.log('generatePreSeedStruct', source);
	return source;
}
export async function generateSeedStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.SEED;
	source.context = CONTEXT.FINAL_SEED;
	console.log('generateSeedStruct', source);
	return source;
}
export async function generatePreKeyStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_KEY;
	source.context = CONTEXT.FINAL_KEY;
	source.key = this.STATE.get('master_key');
	return source;
}
export async function generateKeyStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.KEY;
	source.context = CONTEXT.FINAL_SEED;
	return source;
}
export async function generatePreNonceStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_NONCE;
	source.context = CONTEXT.FINAL_NONCE;
	source.nonce = this.STATE.get('master_nonce');
	return source;
}
export async function generateNonceStruct(source = {}) {
	await this.setDefaults(source);
	source.object_type = OBJECT_TYPE.NONCE;
	source.context = CONTEXT.FINAL_SEED;
	return source;
}
export default {
	generateSeedStruct,
	setStructDefaults,
};
