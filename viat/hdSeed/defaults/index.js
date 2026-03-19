/**
 * @file Defaults.js.
 * @description Defines the core constants, configuration schemas, and enumerations for Hierarchical Deterministic seeds, wallets, keys, and key pairs.
 * It also defines structural constants for trees (relationships, direction), networking environments, application topologies, cryptography, and generic key derivations (context, purpose, schemas).
 * NOTE: This file is using JS libs for browser usage but will need a wrapper for WASM/native modules to ensure  performance.
 */
import aiDefaults from './ai.js';
import cryptoCurrencyDefaults from './cryptocurrency.js';
import cryptoDefaults from './crypto.js';
import serviceDefaults from './service.js';
const {
	CONTEXT_INTENTION, MODES, PURPOSE, SCHEME_TYPES,
} = cryptoDefaults;
const { CRYPTOCURRENCY_NETWORK_TYPES } = cryptoCurrencyDefaults;
/**
 * Represents the type of cryptographic object being generated or derived in the HDST
 * sequence, distinguishing between pre-states and final deterministic outputs.
 */
export const OBJECT_TYPE = {
	PRE_SEED: 0,
	SEED: 1,
	PRE_KEY: 2,
	KEY: 3,
	PRE_NONCE: 4,
	NONCE: 5,
	TRAPDOOR: 6,
	SALT: 7,
};
/**
 * Specifies the classification for nodes within the structural representation
 * of a generic tree or trie structure in the Viat system.
 */
export const TRIE_OBJECT_TYPE = {
	root: 0,
	branch: 1,
	leaf: 2,
};
/**
 * Represents the connection dynamic between two points/nodes in a derivation
 * hierarchy. E.g., PARENT to CHILD, BRANCH to LEAF.
 */
export const RELATIONSHIP = {
	PARENT: 0,
	CHILD: 1,
	BRANCH: 2,
	LEAF: 3,
	ROOT: 4,
};
/**
 * Dictates the multidimensional deterministic growth direction in the tree.
 * Can be used to denote deriving horizontally across children or vertically down chains.
 */
export const DIRECTION = {
	HORIZONTAL: 0,
	VERTICAL: 1,
};
/**
 * Defines the supported encoding and serialization formats for transferring
 * or storing derived HDST seeds, keys, and universal profiles. Prioritizes
 * strict CBOR for deterministic representation.
 */
export const ENCODING_FORMATS = {
	RAW: 0,
	CBOR: 1,
	HEX: 2,
	BASE64: 3,
	BASE64URL: 4,
};
/**
 * Categorizes the Universal Account Identity or Profile linked to a specific
 * HD Seed Tree structure, enabling distinct application capabilities.
 */
export const PROFILE_TYPES = {
	PERSONAL: 0,
	BUSINESS: 1,
	SYSTEM: 2,
	DEVICE: 3,
	AI_AGENT: 4,
	SMART_CONTRACT: 5,
	NODE: 6,
};
/**
 * Determines the physical or theoretical security perimeter where the
 * derived seeds and keys are stored, affecting derivation risk models.
 */
export const STORAGE_SECURITY = {
	HOT: 0,
	COLD: 1,
	HARDWARE: 2,
	SECURE_ENCLAVE: 3,
	HSM: 4,
	DISTRIBUTED: 5,
};
/**
 * Defines the recovery and sharding methodologies supported for
 * reconstructing the MASTER seed in the post-quantum HDST model.
 */
export const RECOVERY_MODES = {
	MNEMONIC: 0,
	SHAMIR: 1,
	MATRIX: 2,
	SOCIAL: 3,
	EMAIL: 4,
	PHONE: 5,
	CODE: 6,
	KEY_PAIR: 7,
	AUTH_VIA_ENCRYPTION: 8,
	SIGNATURE: 9,
};
/**
 * Distinguishes the security bounds of derived tree nodes, adapted from
 * traditional hardened paths for the high-entropy PQ space.
 */
export const DERIVATION_TYPES = {
	// Hardened derivation with high-entropy seeds
	TETHERED: 0,
	// Non-hardened derivation allowing for public key derivation
	AUTONOMOUS: 1,
};
/**
 * Defines the default mapping structure used to assemble the Key (K)
 * parameter for KMAC operations, utilized to construct the final deterministic seed.
 */
export const DEFAULT_KEY_STRUCTURE = {
	scheme: SCHEME_TYPES.MASTER,
	context_intention: CONTEXT_INTENTION.FINAL_SEED,
	mode: MODES.DEFAULT,
};
/**
 * Defines a universal baseline object structure utilized as the generic
 * fallback or initialization state for elements within the HDST hierarchy.
 */
export const DEFAULT_SEED_STRUCTURE = {
	object_type: OBJECT_TYPE.SEED,
	scheme: SCHEME_TYPES.MASTER,
	context_intention: CONTEXT_INTENTION.SEED,
	purpose: PURPOSE.KEY,
	relationship: RELATIONSHIP.ROOT,
	derivation_type: DERIVATION_TYPES.TETHERED,
	network: CRYPTOCURRENCY_NETWORK_TYPES.MAINNET,
};
/**
 * Defines the structural template for generating the Customization
 * field / String (S) passed into KMAC for strict domain separation.
 */
export const DEFAULT_CUSTOMIZATION_NONCE_STRUCTURE = {
	domain: 'VIAT_HDST',
	derivation_type: DERIVATION_TYPES.TETHERED,
	profile: PROFILE_TYPES.PERSONAL,
	purpose: PURPOSE.KEY,
};
const defaultOptions = {
	DIRECTION,
	RELATIONSHIP,
	ENCODING_FORMATS,
	PROFILE_TYPES,
	STORAGE_SECURITY,
	RECOVERY_MODES,
	DERIVATION_TYPES,
	DEFAULT_KEY_STRUCTURE,
	DEFAULT_SEED_STRUCTURE,
	DEFAULT_CUSTOMIZATION_NONCE_STRUCTURE,
	...aiDefaults,
	...cryptoDefaults,
	...cryptoCurrencyDefaults,
	...serviceDefaults,
};
export * from './crypto.js';
export * from './cryptocurrency.js';
export * from './ai.js';
export * from './service.js';
export default defaultOptions;
// example();
