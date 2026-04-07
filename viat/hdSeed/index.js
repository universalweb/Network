/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW -
	! COPYRIGHT © 2025 Thomas Marchi
	! This module has it's own JS dependencies to make it easy to port to browsers do not mix it with NODE or native modules
	? Vertical and Horizontal Seed Derivation
	* Instead of using a private or public key as the source for other keys we use high-entropy large seeds
	^ <==================================================>
	1) Generate 2-3 Secret Entropy Pools: Seed, Key, Nonce
	2) Each pool must be generated using multiple sources of entropy
	3) The result is: Secret Master Seed, Secret Master Key, Secret Master Nonce (optional).
	^ <==================================================>
*/
import {
	CRYPTOCURRENCY_NETWORK_TYPES,
	HASH_ALGORITHMS,
	KEYED_HASH_ALGORITHMS,
	MASTER_ENTROPY_POOL_SIZES,
	NETWORK_NAMES,
	OBJECT_TYPE,
	PROPERTY_LOOKUP,
	PURPOSE,
	RELATIONSHIP,
	SCHEME_TYPES,
	VALID_PROPERTY_NAMES,
} from './defaults/index.js';
import {
	assign, eachObject, extendClass,
	hasValue, isPlainObject, isString,
} from '@universalweb/utilitylib';
import { createKey, createNonce, createSalt } from './key.js';
import {
	encode,
	getSeedSize,
	hash,
	kmac,
	normalize,
} from './utils.js';
import info from './methods/info.js';
import masterMethods from './methods/master.js';
import stateMethods from './methods/state.js';
import structMethods from './methods/structs.js';
/*
	NOTE: This is a Post-Quantum Hierarchical Deterministic Wallet & Keypair generator
	NOTE: This is for Parent to Direct Child generation per-class instance. Branch/Root with direct leaves
	TODO: Add trapdoor deterministic generation support
*/
export const STATE_DEFAULTS = {
	version: 1,
	hash_algorithm: HASH_ALGORITHMS.SHAKE_256,
	keyed_hash_algorithm: KEYED_HASH_ALGORITHMS.KMAC_256_XOF,
	network_name: NETWORK_NAMES.VIAT,
	wallet_beta: true,
	master_seed: null,
	master_key: null,
	master_nonce: null,
	master_salt: null,
	encrypted: false,
	seed_size: MASTER_ENTROPY_POOL_SIZES.DEFAULT,
};
export class HDSeed {
	constructor(preConfig) {
		return this;
	}
	static STATE_DEFAULTS = STATE_DEFAULTS;
	static VALID_PROPERTY_NAMES = VALID_PROPERTY_NAMES;
	static PROPERTY_LOOKUP = PROPERTY_LOOKUP;
	static async create(config) {
		const instance = new HDSeed(config);
		if (config && config.STATE) {
			await instance.initialize(config.STATE);
		}
		if (!config?.STATE?.master_seed) {
			await instance.createMasterSeeds();
		}
		return instance;
	}
	static async createSiteWallet(config = {}) {
		config.STATE = config.STATE || {};
		config.STATE.wallet_site_beta = true;
		const instance = await HDSeed.create(config);
		return instance;
	}
	isHDSeed = true;
	STATE = new Map(Object.entries(STATE_DEFAULTS));
	async initialize(config) {
		if (config?.STATE) {
			await this.set(config.STATE);
		}
		return this;
	}
	destroy() {
		this.STATE.clear();
		this.isHDSeed = false;
	}
	async getPreSalt(source = {}) {
		const sourceStruct = await this.generatePreSaltStruct(assign({}, source));
		const sourceStructure = await hash(await encode(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getSalt(source = {}) {
		const pre_salt = await this.getPreSalt(source);
		const sourceStruct = await this.generateSaltStruct(assign({
			pre_salt,
		}, source));
		return createSalt(sourceStruct);
	}
	async getPreKey(source = {}) {
		const sourceStruct = await this.generatePreKeyStruct(assign({}, source));
		const sourceStructure = await hash(await encode(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getKey(source = {}) {
		const pre_key = await this.getPreKey(source);
		const sourceStruct = await this.generateKeyStruct(assign({
			pre_key,
		}, source));
		return createKey(sourceStruct);
	}
	async getPreNonce(source = {}) {
		const sourceStruct = await this.generatePreNonceStruct(assign({}, source));
		const sourceStructure = await hash(await encode(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getNonce(source = {}) {
		const pre_nonce = await this.getPreNonce(source);
		const sourceStruct = await this.generateNonceStruct(assign({
			pre_nonce,
		}, source));
		return createNonce(sourceStruct);
	}
	async getPreSeed(source = {}) {
		const sourceStruct = await this.generatePreSeedStruct(assign({}, source));
		const preSeed = await normalize(sourceStruct, await this.get('seed_size'));
		return preSeed;
	}
	async getFinalSeed(source = {}, secretHash) {
		const pre_seed = await this.getPreSeed(source);
		const finalSeedStruct = assign({
			pre_seed,
		}, source);
		if (secretHash) {
			finalSeedStruct.secret_hash = secretHash;
		}
		const sourceStruct = await this.generateSeedStruct(finalSeedStruct);
		const finalSeed = await normalize(sourceStruct, await this.get('seed_size'));
		return finalSeed;
	}
	async getSeed(source = {}, keyArg, nonceArg, guardKey, seedSizeArg) {
		const seedSize = seedSizeArg || getSeedSize(source.scheme);
		const key = (!keyArg || isPlainObject(keyArg)) ? await this.getKey(keyArg || source) : keyArg;
		const nonce = (!nonceArg || isPlainObject(nonceArg)) ? await this.getNonce(nonceArg || source) : nonceArg;
		const finalSeed = await this.getFinalSeed(source, guardKey);
		const customization = await encode(assign({
			nonce,
		}, source));
		const seed = await kmac(key, finalSeed, seedSize, customization);
		return seed;
	}
	async getTrapdoorSeed(source = {}, keyArg, nonceArg, guardKey, seedSizeArg) {
		const seedConfig = assign({
			trapdoor: true,
			alt_object_type: OBJECT_TYPE.TRAPDOOR,
			alt_purpose: PURPOSE.TRAPDOOR,
		}, source);
		return this.getSeed(seedConfig, keyArg, nonceArg, guardKey, seedSizeArg);
	}
	async getWalletSeed(source = {}, seedSize) {
		const seed = await this.getSeed(source, null, null, null, seedSize);
		const trapdoorSeed = await this.getTrapdoorSeed(source, null, null, null, seedSize);
		return {
			seed,
			trapdoorSeed,
		};
	}
	async exportBinary() {
		const source = await this.exportObject();
		return encode(source);
	}
}
extendClass(HDSeed, masterMethods, info, structMethods, stateMethods);
/*
	! QUANTUM Hierarchal Deterministic Seed, Key, Key pair, user profile, login, 2FA, & Wallet Generation
	Master Seed -> V Pre-Seed 0 -> V Seed 1 -> Seed Final
					            -> H Pre-Seed 0 -> H Seed 1 -> Seed Final
*/
export default HDSeed;
