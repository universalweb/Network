/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW -
	! COPYRIGHT © 2025 Thomas Marchi
	! This module has it's own JS dependencies to make it easy to port to browsers do not mix it with NODE or native modules
	? Vertical and Horizontal Key Derivation
	* Instead of using a private or public key as the source for other keys we use high-entropy large seeds
	^ <==================================================>
	1) Generate 3 Secret Entropy Buckets: Seed, Key, Nonce
	2) Each Secret Master Seeds are generated from 256 bytes of crypto PRNG data and 2 ephemeral throw-away ml_kem1024 shared secrets.
	3) The result is: Secret Master Seed, Secret Master Key, Secret Master Nonce.
	^ <==================================================>
*/
import {
	CONTEXT, HASH_ALGORITHMS, KEY_PURPOSE, NETWORK_NAMES, NETWORK_TYPES, RELATIONSHIP, SCHEME_TYPES,
} from './defaults.js';
import {
	assign, eachObject, extendClass, hasValue, isString, noValue,
} from '@universalweb/utilitylib';
import { getKeyGenSeedSize, kmac, normalize } from './utils.js';
import { createKey } from './key.js';
import info from './methods/info.js';
import masterMethods from './methods/master.js';
/*
	NOTE: This is a Post-Quantum Hierarchical Deterministic Wallet & Keypair generator
	TODO: Store only encrypted master seed, key, nonce in memory/disk when using prompt user to decrypt
*/
export class HDKeypair {
	STATE = {
		version: 1,
		// network_type: 'MAINNET',
		// network: 'VIAT',
		hash_algorithm: 'SHAKE256',
	};
	VALID_PROPERTIES = [
		'version',
		'kind',
		'context',
		'network',
		'network_type',
		'relationship',
		'id',
		'scheme',
		'hash_algorithm',
	];
	KEY_PROPERTIES = {
		kind: KEY_PURPOSE,
		network: NETWORK_NAMES,
		network_type: NETWORK_TYPES,
		relationship: RELATIONSHIP,
		scheme: SCHEME_TYPES,
		hash_algorithm: HASH_ALGORITHMS,
	};
	DOMAIN_DEFAULTS = {
		// Key purpose
		key_purpose: KEY_PURPOSE.SIGN,
		// Context
		context: CONTEXT.SEED,
		relationship: RELATIONSHIP.CHILD,
		// Vertical derivation
		id: 0,
		// horizontal derivation
		hid: 0,
		scheme: SCHEME_TYPES.MASTER,
	};
	constructor(config) {
		config && assign(this.STATE, config);
		return this;
	}
	async create() {
		await this.generateMasterKey();
		await this.generateMasterNonce();
		await this.generateMasterSeed();
		return this;
	}
	async getKey(config, source = {}) {
		await this.generateDomain(config, source);
		await this.generateKeyStruct(config, source);
		const key = await createKey(source);
		console.log('Generated Child Key', key);
		await this.describeObject(source);
		return key;
	}
	async getPreSeed(config, source = {}) {
		await this.generateDomain(config, source);
		await this.generateSeedStruct(config, source);
		return normalize(source, 256);
	}
	async getSeed(config, source = {}) {
		const preSeed = await this.getPreSeed(config, source);
		console.log('generateDilithiumSeed');
		const key = await this.getKey(config);
		this.describeObject(source);
		return kmac(key, preSeed, getKeyGenSeedSize(source.scheme));
	}
	async generateSeedStruct(config, source = {}) {
		source.context = CONTEXT.SEED;
		source.key_purpose = hasValue(source.key_purpose) ? source.key_purpose : KEY_PURPOSE.SEED;
		source.scheme = hasValue(source.scheme) ? source.scheme : SCHEME_TYPES.MASTER;
		source.relationship = RELATIONSHIP.CHILD;
		source.seed = this.STATE.masterSeed;
		console.log('generateSeedStruct', source, config);
		return source;
	}
	async generateDomain(config, source = {}) {
		const {
			KEY_PROPERTIES,
			DOMAIN_DEFAULTS,
		} = this;
		assign(source, DOMAIN_DEFAULTS);
		eachObject(config, (value, key) => {
			if (isString(value) && hasValue(KEY_PROPERTIES[key])) {
				source[key] = KEY_PROPERTIES[key][value];
				// console.log(`Converting string to key property for ${key}: ${value}`, KEY_PROPERTIES[key][value], source);
			} else if (hasValue(value)) {
				source[key] = value;
			} else if (noValue(source[key]) && hasValue(DOMAIN_DEFAULTS[key])) {
				source[key] = DOMAIN_DEFAULTS[key];
			}
		});
		return source;
	}
	async generateKeyStruct(config = {}, source = {}) {
		source.context = CONTEXT.KEY;
		source.key_purpose = KEY_PURPOSE.SIGN;
		source.key = this.STATE.masterKey;
		return source;
	}
	async exportObject() {
		const source = {};
		assign(source, this.STATE);
		return source;
	}
}
extendClass(HDKeypair, masterMethods, info);
async function example() {
	const walletExample = new HDKeypair({});
	await walletExample.create();
	await walletExample.logInfo();
	const seed = await walletExample.getSeed({
		scheme: SCHEME_TYPES.ML_DSA_65,
	});
	console.log(seed);
	// console.log(
	// 	'LAST SEED',
	// 	await walletExample.generateSeedChain(5, {
	// 		scheme: SCHEME_TYPES.ML_DSA_65,
	// 	})
	// );
}
await example();
/*
	~ ██████╗  ██████╗ ███████╗████████╗    ██████╗ ████████╗
	~ ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝   ██╔═══██╗╚══██╔══╝
	~ ██████╔╝██║   ██║███████╗   ██║█████╗██║   ██║   ██║
	~ ██╔═══╝ ██║   ██║╚════██║   ██║╚════╝██║▄▄ ██║   ██║
	~ ██║     ╚██████╔╝███████║   ██║      ╚██████╔╝   ██║
	~ ╚═╝      ╚═════╝ ╚══════╝   ╚═╝       ╚══▀▀═╝    ╚═╝
	██╗  ██╗██████╗     ██╗  ██╗███████╗██╗   ██╗    ██████╗  █████╗ ██╗██████╗ ███████╗
	██║  ██║██╔══██╗    ██║ ██╔╝██╔════╝╚██╗ ██╔╝    ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝
	███████║██║  ██║    █████╔╝ █████╗   ╚████╔╝     ██████╔╝███████║██║██████╔╝███████╗
	██╔══██║██║  ██║    ██╔═██╗ ██╔══╝    ╚██╔╝      ██╔═══╝ ██╔══██║██║██╔══██╗╚════██║
	██║  ██║██████╔╝    ██║  ██╗███████╗   ██║       ██║     ██║  ██║██║██║  ██║███████║
	╚═╝  ╚═╝╚═════╝     ╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝
	! QUANTUM Hierarchal Deterministic Key, Keypair, & Wallet Generation
*/
