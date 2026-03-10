import {
	OBJECT_TYPE,
	PURPOSE,
} from '../defaults.js';
import { noValue } from '@universalweb/utilitylib';
export async function setStructDefaults(source) {
	const {
		hash_algorithm,
		keyed_hash_algorithm,
		version,
		network_name,
		wallet_beta,
	} = await this.get();
	source.hash_algorithm = hash_algorithm;
	source.keyed_hash_algorithm = keyed_hash_algorithm;
	source.version = version;
	source.network_name = network_name;
	source.wallet_beta = wallet_beta;
}
export async function generatePreSeedStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_SEED;
	source.seed = this.get('master_seed');
	console.log('generatePreSeedStruct', source);
	return source;
}
export async function generateSeedStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.SEED;
	console.log('generateSeedStruct', source);
	return source;
}
export async function generatePreKeyStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_KEY;
	source.key = this.get('master_key');
	return source;
}
export async function generateKeyStruct(source = {}, pre_key) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.KEY;
	return source;
}
export async function generatePreNonceStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_NONCE;
	source.nonce = this.get('master_nonce');
	return source;
}
export async function generateNonceStruct(source = {}, pre_nonce) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.NONCE;
	if (pre_nonce) {
		source.pre_nonce = pre_nonce;
	}
	return source;
}
export default {
	generateSeedStruct,
	setStructDefaults,
	generatePreSeedStruct,
	generateKeyStruct,
	generatePreKeyStruct,
	generateNonceStruct,
	generatePreNonceStruct,
};
