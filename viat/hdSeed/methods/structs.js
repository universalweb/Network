import {
	OBJECT_TYPE,
	PURPOSE,
} from '../defaults/index.js';
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
	source.seed = await this.get('master_seed');
	await this.describeObject(source);
	return source;
}
export async function generateSeedStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.SEED;
	await this.describeObject(source);
	return source;
}
export async function generatePreKeyStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_KEY;
	source.key = await this.get('master_key');
	await this.describeObject(source);
	return source;
}
export async function generateKeyStruct(source = {}, pre_key) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.KEY;
	await this.describeObject(source);
	return source;
}
export async function generatePreNonceStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_NONCE;
	source.nonce = await this.get('master_nonce');
	await this.describeObject(source);
	return source;
}
export async function generateNonceStruct(source = {}, pre_nonce) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.NONCE;
	if (pre_nonce) {
		source.pre_nonce = pre_nonce;
	}
	await this.describeObject(source);
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
