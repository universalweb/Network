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
	MASTER_ENTROPY_POOL_SIZES,
	NETWORK_NAMES,
	OBJECT_TYPE,
	PURPOSE,
	RELATIONSHIP,
	SCHEME_TYPES,
} from './defaults/index.js';
import {
	assign, clone, each, eachArray, eachObject, extendClass,
	hasValue, isArray, isPlainObject, isString,
	isUndefined,
} from '@universalweb/utilitylib';
import { createKey, createNonce } from './key.js';
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
	keyed_hash_algorithm: HASH_ALGORITHMS.KMAC_256_XOF,
	network_name: NETWORK_NAMES.VIAT,
	wallet_beta: true,
	master_seed: null,
	master_key: null,
	master_nonce: null,
	encrypted: false,
	seed_size: MASTER_ENTROPY_POOL_SIZES.DEFAULT,
};
export class HDSeed {
	constructor(config) {
		if (config) {
			return this.initialize(config);
		}
		return this;
	}
	async initialize(config) {
		const STATE = config?.STATE;
		if (STATE) {
			await this.set(STATE);
		}
		return this;
	}
	isHDSeed = true;
	static STATE_DEFAULTS = STATE_DEFAULTS;
	STATE = new Map(Object.entries(STATE_DEFAULTS));
	static VALID_PROPERTY_NAMES = [
		'version',
		'kind',
		'context',
		'network',
		'cryptocurrency_network_type',
		'relationship',
		'id',
		'horizontal_id',
		'vertical_id',
		'scheme',
		'mode',
		'hash_algorithm',
		'keyed_hash_algorithm',
		'purpose',
		'master_seed',
		'master_key',
		'master_nonce',
	];
	static KEY_PROPERTIES = {
		kind: PURPOSE,
		network: NETWORK_NAMES,
		cryptocurrency_network_type: CRYPTOCURRENCY_NETWORK_TYPES,
		relationship: RELATIONSHIP,
		scheme: SCHEME_TYPES,
		hash_algorithm: HASH_ALGORITHMS,
	};
	async getAll() {
		const mapIter = this.STATE.entries();
		const objectMap = {};
		this.STATE.forEach((value, key) => {
			objectMap[key] = value;
		});
		return objectMap;
	}
	async zeroBuffers() {
		const {
			master_seed, master_key, master_nonce,
		} = await this.getAll();
		if (master_seed) {
			master_seed.fill(0);
		}
		if (master_key) {
			master_key.fill(0);
		}
		if (master_nonce) {
			master_nonce.fill(0);
		}
		return this;
	}
	async create() {
		await this.generateMasterKey();
		await this.generateMasterNonce();
		await this.generateMasterSeed();
		return this;
	}
	async getPreKey(source = {}) {
		const sourceStruct = await this.generatePreKeyStruct(assign({}, source));
		const sourceStructure = hash(await encode(sourceStruct), 256);
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
		const sourceStructure = hash(await encode(sourceStruct), 256);
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
		const preSeed = await normalize(sourceStruct, 256);
		return preSeed;
	}
	async getFinalSeed(source = {}, secretHash) {
		const preSeed = await this.getPreSeed(source);
		const finalSeedStruct = assign({
			pre_seed: preSeed,
		}, source);
		if (secretHash) {
			finalSeedStruct.secret_hash = secretHash;
		}
		const sourceStruct = await this.generateSeedStruct(finalSeedStruct);
		const finalSeed = await normalize(sourceStruct, 256);
		return finalSeed;
	}
	async getSeed(source = {}, keyArg, nonceArg, guardKey) {
		const seedSize = getSeedSize(source.scheme);
		const key = (!keyArg || isPlainObject(keyArg)) ? await this.getKey(keyArg || source) : keyArg;
		const nonce = (!nonceArg || isPlainObject(nonceArg)) ? await this.getNonce(nonceArg || source) : nonceArg;
		const finalSeed = await this.getFinalSeed(source, guardKey);
		const seed = await kmac(key, finalSeed, seedSize, nonce);
		return seed;
	}
	async getTrapdoorSeed(source = {}, keyArg, nonceArg, guardKey) {
		const seedSize = assign({
			trapdoor: true,
			alt_object_type: OBJECT_TYPE.TRAPDOOR,
			alt_purpose: PURPOSE.TRAPDOOR,
		}, source);
		return this.getSeed(source, keyArg, nonceArg, guardKey);
	}
	async guardKey(source = {}) {
	}
	async generateDomainFromConfig(source = {}) {
		const { KEY_PROPERTIES } = HDSeed;
		eachObject(source, (value, key) => {
			if (isString(value) && hasValue(KEY_PROPERTIES[key])) {
				source[key] = KEY_PROPERTIES[key][value];
				// console.log(`Converting string to key property for ${key}: ${value}`, KEY_PROPERTIES[key][value], source);
			} else if (hasValue(value)) {
				source[key] = value;
			}
		});
		return source;
	}
	async exportObject() {
		return this.getAll();
	}
	async importObject(source) {
		await this.set(source);
		return this;
	}
	async exportBinary() {
		const source = await this.exportObject();
		return encode(source);
	}
}
extendClass(HDSeed, masterMethods, info, structMethods, stateMethods);
/*
	! QUANTUM Hierarchal Deterministic Seed, Key, Keypair, & Wallet Generation
	Master Seed -> V Pre-Seed 0 -> V Seed 1 -> Seed Final
					            -> H Pre-Seed 0 -> H Seed 1 -> Seed Final
*/
export async function createHDSeed(config) {
	const instance = new HDSeed(config);
	return instance;
}
createHDSeed.classConstructor = HDSeed;
export default createHDSeed;
