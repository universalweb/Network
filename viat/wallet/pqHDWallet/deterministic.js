/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW - copyright © 2025 Thomas Marchi
	!QUANTUM Hierarchal Deterministic Wallet Generation
	? Vertical and Horizontal Key Derivation
	^ Uses A Dual-Secret Envelope using AEGIS-256 (Secret Key & Secret Nonce both never re-used) (DSE)
	^ The encrypted payload is hashed to the size required by the scheme
	* Instead of using a private or public key as the source for other keys we use high-entropy encrypted seeds to isolate if compromised
	^ <==================================================>
	1) Generate 3 Secret Master Seeds: Master Seed, Secret Seed, Nonce Seed
	1) Each Secret Master Seeds are generated from 256 bytes of crypto PRNG data and 2 ephemeral throw-away ml_kem1024 shared secrets.
	1) The output is then placed into a strict CBOR structure to introduce domain separation.
	1) The result is: Secret Master Seed, Secret Master Key Seed, Secret Master Nonce Seed.
	^ <==================================================>
	~ Default Mode of Operation: Start from Secret Seeds then generate any child key directly
	---
	Creating a key pair follows these steps:
	Use Master Secret Seeds to generate another set of deterministic large child seed, child secret key seed, child secret nonce seed
	Install domain for child secret key seed and the nonce to generate a smaller 32 byte hash from both which are unique to this specific child key pair
	Encrypt with AEGIS-256 the large child seed with the new child secret key and nonce
	Finalize the see by hashing it down to the required seed size for the key pair
	The final hash is the seed for your new key pair
	^ <==================================================>
	~ Chain Mode of Operation: Start from Master Seed then generate child seeds in a chain
	---
	Creating a key pair follows all prior steps but instead requires the previous child's seed, key, and nonce to generate the next child seed
	The process is none reversible without all prior seeds making it more secure against quantum attacks
	It also requires the unencrypted seed to generate the next
	encrypted seed eS0 -> hashed(CBOR{eS0, Meta}) -> encrypted seed with new key and nonce
	^ <==================================================>
	& KMAC (Keyed Hash) seeds can be used to prove ownership later useful for onetime key pairs
	! IN CHAIN MODE COULD USE MEMORY HARD HASHING TO SLOW DOWN ATTACKS FURTHER
*/
import {
	CONTEXT,
	HASH_ALGORITHMS,
	KEY_PURPOSES, NETWORKS,
	NETWORK_NAMES,
	RELATIONSHIP,
	SCHEME_TYPES,
} from './defaults.js';
import {
	assign,
	eachObject,
	extendClass,
	hasValue, isString, noValue, timesAsync,
} from '@universalweb/utilitylib';
import encryptionMethods from './methods/encryption.js';
import info from './methods/info.js';
import masterGenerators from './secretSeed.js';
import masterMethods from './methods/master.js';
import utils from './methods/utils.js';
/*
	NOTE: This is a Post-Quantum Hierarchical Deterministic Wallet (HD Wallet) but designed to be secure against both classical, post-quantum, and unknown attacks
*/
class QHDWallet {
	constructor(config) {
		config && assign(this.info, config);
		return this;
	}
	info = {
		version: 1,
		network: 'MAINNET',
		networkName: 'VIAT',
		hashAlgorithm: 'SHAKE256',
	};
	async create() {
		await this.generateMasterKey();
		await this.generateMasterNonce();
		await this.generateMasterSeed();
	}
	async generateChildKeySeed(config, source = {}) {
		await this.generateDomain(config, source);
		await this.generateKeyStruct(config, source);
		return source;
	}
	async generateChildKey(config, source = {}) {
		await this.generateChildKeySeed(config, source);
		console.log('generateChildKey', source);
		const key = await this.createKey(source);
		return key;
	}
	async generateChildNonceSeed(config, source = {}) {
		await this.generateDomain(config, source);
		await this.generateNonceStruct(config, source);
		return source;
	}
	async generateChildNonce(config, source = {}) {
		await this.generateChildNonceSeed(config, source);
		const nonce = await this.createNonce(source);
		return nonce;
	}
	async getSeed(config, source = {}) {
		const encryptedSeed = await this.generateEncryptedSeed(config, source);
		console.log('generateDilithiumSeed');
		this.describeObject(source);
		return this.getKeyGenSeed(encryptedSeed, source.scheme);
	}
	async generateSeed(config, source = {}) {
		await this.generateDomain(config, source);
		await this.generateSeedStruct(config, source);
		await this.generateChildSeedStruct(config, source);
		return this.normalizeSeed(source);
	}
	async generateSeedStruct(config, source = {}) {
		source.context = CONTEXT.SEED;
		source.kind = hasValue(config.kind) ? config.kind : source.kind || KEY_PURPOSES.SEED;
		source.scheme = hasValue(config.scheme) ? config.scheme : source.scheme || SCHEME_TYPES.MASTER;
		console.log('generateSeedStruct', source, config);
		return source;
	}
	async generateChildSeedStruct(config, source = {}) {
		source.relationship = RELATIONSHIP.CHILD;
		source.seed = this.info.masterSeed;
		return source;
	}
	async generateEncryptedSeed(config, source = {}) {
		const encoded = await this.generateSeed(config, source);
		const key = await this.generateChildKey({
			scheme: source.scheme,
			id: source.id,
		});
		const nonce = await this.generateChildNonce({
			scheme: source.scheme,
			id: source.id,
		});
		return this.encrypt(encoded, key, nonce);
	}
	/*
		Generates seeds enforced as an encrypted seed chain
		Each seed in the chain is derived from the previous encrypted then hashed seed
		An attacker would need to break each seed in the chain to reach the final seed
	*/
	// NOTE: Need to start with fresh encrypted seed
	async generateSeedChain(endIndex, config) {
		let lastSeed = this.info.masterSeed;
		let lastKey;
		let lastNonce;
		const selfContext = this;
		await timesAsync(endIndex, async (id) => {
			console.log(id);
			const source = {
				id,
			};
			const encoded = await this.generateSeed(config, source);
			lastKey = await this.generateChildKey({
				scheme: source.scheme,
				key: lastKey,
				id,
			});
			this.describeObject(lastKey);
			lastNonce = await this.generateChildNonce({
				scheme: source.scheme,
				nonce: lastNonce,
				id,
			});
			this.describeObject(lastNonce);
			lastSeed = await this.encrypt(encoded, lastKey, lastNonce);
			console.log('encapsulated seed', id, lastSeed);
		});
		return lastSeed;
	}
	validProperties = [
		'version',
		'kind',
		'context',
		'network',
		'networkName',
		'relationship',
		'id',
		'scheme',
		'hashAlgorithm',
	];
	keyProperties = {
		kind: KEY_PURPOSES,
		network: NETWORKS,
		networkName: NETWORK_NAMES,
		relationship: RELATIONSHIP,
		scheme: SCHEME_TYPES,
		hashAlgorithm: HASH_ALGORITHMS,
	};
	domainDefaults = {
		version: this.version,
		kind: KEY_PURPOSES.SIGNING,
		context: CONTEXT.SEED,
		network: NETWORKS.MAINNET,
		networkName: NETWORK_NAMES.VIAT,
		relationship: RELATIONSHIP.CHILD,
		id: 0,
		scheme: SCHEME_TYPES.MASTER,
		hashAlgorithm: HASH_ALGORITHMS.SHAKE256,
	};
	async generateDomain(config, source) {
		const {
			keyProperties,
			domainDefaults,
		} = this;
		eachObject(config, (value, key) => {
			if (isString(value) && keyProperties[key]) {
				source[key] = keyProperties[key][value];
			} else if (hasValue(value)) {
				source[key] = value;
			} else if (noValue(source[key]) && this[key]) {
			} else {
				source[key] = domainDefaults[key];
			}
		});
		return source;
	}
	async generateKeyStruct(config = {}, source = {}) {
		source.context = CONTEXT.SECRET_KEY;
		source.kind = KEY_PURPOSES.SECRET_KEY;
		source.key = this.masterKey;
		return source;
	}
	async generateNonceStruct(config = {}, source = {}) {
		source.context = CONTEXT.SECRET_NONCE;
		source.kind = KEY_PURPOSES.NONCE;
		source.nonce = this.masterNonce;
		return source;
	}
}
extendClass(QHDWallet, masterGenerators, masterMethods, utils, encryptionMethods, info);
async function example() {
	const qhdwallet = new QHDWallet({});
	await qhdwallet.create();
	await qhdwallet.logInfo();
	console.log(await qhdwallet.getSeed({
		scheme: 'ML_DSA_65',
	}));
	// console.log(
	// 	'LAST SEED',
	// 	await qhdwallet.generateSeedChain(5, {
	// 		scheme: SCHEME_TYPES.ML_DSA_65,
	// 	})
	// );
}
await example();
/*
	& WELCOME TO THE QUANTUM RESISTANT HD WALLET SYSTEM
!    ██████╗     ██████╗  ██████╗ ██████╗ ██╗   ██╗
!    ╚════██╗    ██╔══██╗██╔═══██╗██╔══██╗╚██╗ ██╔╝
!     █████╔╝    ██████╔╝██║   ██║██║  ██║ ╚████╔╝
!     ╚═══██╗    ██╔══██╗██║   ██║██║  ██║  ╚██╔╝
!    ██████╔╝    ██████╔╝╚██████╔╝██████╔╝   ██║
!    ╚═════╝     ╚═════╝  ╚═════╝ ╚═════╝    ╚═╝
!    ██████╗ ██████╗  ██████╗ ██████╗ ██╗     ███████╗███╗   ███╗
!    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║     ██╔════╝████╗ ████║
!    ██████╔╝██████╔╝██║   ██║██████╔╝██║     █████╗  ██╔████╔██║
!    ██╔═══╝ ██╔══██╗██║   ██║██╔══██╗██║     ██╔══╝  ██║╚██╔╝██║
!    ██║     ██║  ██║╚██████╔╝██████╔╝███████╗███████╗██║ ╚═╝ ██║
!    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝
*/
