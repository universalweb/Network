import {
	CONTEXT,
	HASH_ALGORITHMS,
	KEY_PURPOSES,
	MASTER_SEED_ENTROPY_SIZES,
	NETWORKS,
	NETWORK_NAMES,
	RELATIONSHIP,
	SCHEME_TYPES,
	SEED_SIZES,
} from '../defaults.js';
import {
	assign,
	hasValue,
	isArray,
	isBuffer,
	isPlainObject,
	isString,
	isU8,
	noValue,
	timesAsync,
} from '@universalweb/utilitylib';
import { decodeSync, encode, encodeStrict } from '#utilities/serialize';
import { hash256, hashXOF } from '#crypto/hash/shake.js';
import aegis256 from '#cipher/AEGIS256';
export async function encrypt(data, key, nonce, ad) {
	const normalizedKey = (key?.length === 32) ? key : await this.createKey(key);
	const nonceNormalized = (nonce?.length === 32) ? nonce : await this.createNonce(nonce);
	const dataBuffer = (isPlainObject(data)) ? await encodeStrict(data) : data;
	return aegis256.encryptDetached(dataBuffer, normalizedKey, nonceNormalized, ad);
}
export async function dencrypt(data, key, nonce, ad) {
	const normalizedKey = (key?.length === 32) ? key : await this.createKey(key);
	const nonceNormalized = (nonce?.length === 32) ? nonce : await this.createNonce(nonce);
	const dataBuffer = (isPlainObject(data)) ? await encodeStrict(data) : data;
	return aegis256.decryptDetached(dataBuffer, normalizedKey, nonceNormalized, ad);
}
export async function createKey(source, size) {
	console.log('createKey source', source);
	if (source.length === 32) {
		return source;
	}
	return hashXOF((isPlainObject(source)) ? await encodeStrict(source) : source, size || 32);
}
export async function createNonce(source, size) {
	if (source.length === 32) {
		return source;
	}
	return hashXOF((isPlainObject(source)) ? await encodeStrict(source) : source, size || aegis256.nonceSize);
}
export default {
	encrypt,
	dencrypt,
	createKey,
	createNonce,
};
