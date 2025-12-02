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
	extendClass,
	hasValue,
	isArray,
	isBuffer,
	isPlainObject,
	isString,
	isU8,
	noValue,
	timesAsync,
} from '@universalweb/utilitylib';
import { decodeSync, encodeStrict } from '#utilities/serialize';
import { hash256, hashXOF } from '#crypto/hash/shake.js';
import { randomBuffer } from '#crypto/utils.js';
export async function exportObject() {
	if (!this.masterSeed) {
		await this.encryptMasterSeed();
	}
	return {
		version: this.version,
		masterSeed: this.masterSeed,
		masterKey: this.masterKey,
		masterNonce: this.masterNonce,
		network: this.network,
		networkName: this.networkName,
		hashAlgorithm: this.hashAlgorithm,
	};
}
export function encode(source) {
	return encodeStrict(source);
}
export function createRandomBuffer(size = 256) {
	const seed = randomBuffer(size);
	return seed;
}
export function getKeyGenSeedSize(schemeType) {
	return SEED_SIZES[schemeType] || 64;
}
export function getKeyGenSeed(source, schemeType) {
	return hashXOF(source, getKeyGenSeedSize(schemeType));
}
export async function validateSeedObject(source, errors = []) {
	const requiredProperties = ['seed'];
	requiredProperties.forEach((item) => {
		if (noValue(source[item])) {
			errors.push(`Missing required property: ${item}`);
		}
	});
	await this.validateObject(source, errors);
	return (errors.length && errors) || true;
}
export function validateObject(source, errors = []) {
	const requiredProperties = [
		'version',
		'kind',
		'context',
		'network',
		'relationship',
		'id',
		'scheme',
	];
	requiredProperties.forEach((item) => {
		if (noValue(source[item])) {
			errors.push(`Missing required property: ${item}`);
		}
	});
	return (errors?.length && errors) || true;
}
export async function normalizeSeed(source) {
	if (isPlainObject(source)) {
		const encoded = await encodeStrict(source);
		return hashXOF(encoded, MASTER_SEED_ENTROPY_SIZES.default);
	}
	if (isBuffer(source) || isU8(source)) {
		return hashXOF(source, MASTER_SEED_ENTROPY_SIZES.default);
	}
}
export default {
	exportObject,
	encode,
	createRandomBuffer,
	getKeyGenSeedSize,
	getKeyGenSeed,
	validateSeedObject,
	validateObject,
	normalizeSeed,
};
