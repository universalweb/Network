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
	NETWORK_NAMES,
	PURPOSE,
	RELATIONSHIP,
	SCHEME_TYPES,
} from './defaults.js';
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
	TODO: Store only encrypted master seed, key, nonce in memory/disk when using prompt user to decrypt
	NOTE: This is for Parent to Direct Child generation per-class instance.
	NOTE: Branch/Root with direct leaves (Keys, Pre-Seeds, Seeds)
*/
export class HDSeed {
	constructor(config) {
		config && this.setState(config);
		return this;
	}
	isHDSeed = true;
	STATE = new Map(Object.entries({
		version: 1,
		hash_algorithm: HASH_ALGORITHMS.SHAKE_256,
		keyed_hash_algorithm: HASH_ALGORITHMS.KMAC_256_XOF,
		network_name: NETWORK_NAMES.VIAT,
		wallet_beta: true,
		master_seed: null,
		master_key: null,
		master_nonce: null,
	}));
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
	getAll() {
		const mapIter = this.STATE.entries();
		const objectMap = {};
		this.STATE.forEach((value, key) => {
			objectMap[key] = value;
		});
		return objectMap;
	}
	get(key, target) {
		if (isUndefined(key)) {
			return this.getAll();
		}
		if (isString(key)) {
			return this.STATE.get(key);
		}
		if (isArray(key)) {
			const result = {};
			eachArray(key, (value) => {
				result[value] = this.STATE.get(value);
			});
			return result;
		}
		if (isPlainObject(key)) {
			const result = target || key;
			eachObject(key, (value, stateKey) => {
				result[stateKey] = this.STATE.get(stateKey);
			});
			return result;
		}
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
		await this.describeObject(source);
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
		await this.describeObject(source);
		return createNonce(sourceStruct);
	}
	async getPreSeed(source = {}) {
		const sourceStruct = await this.generatePreSeedStruct(assign({}, source));
		const preSeed = await normalize(sourceStruct, 256);
		await this.describeObject(source);
		return preSeed;
	}
	async getSeed(source = {}, keyArg, nonceArg) {
		const preSeed = await this.getPreSeed(source);
		const seedSize = getSeedSize(source.scheme);
		const key = keyArg || await this.getKey(source);
		const nonce = nonceArg || await this.getNonce(source);
		const seed = await kmac(key, preSeed, seedSize, nonce);
		return seed;
	}
	async getFinalSeed(source = {}) {
		const key = await this.getKey(source);
		const nonce = await this.getNonce(source);
		const seed = await this.getSeed(source, key, nonce);
		return seed;
	}
	async generateDomainFromConfig(source = {}) {
		const { KEY_PROPERTIES } = this.constructor;
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
		const source = clone(this.STATE);
		return source;
	}
	async importObject(source) {
		this.setState(source);
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
