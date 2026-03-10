/**
 * @file Defaults.js.
 * @description Defines the core constants, configuration schemas, and enumerations for the Hierarchical Deterministic
 * Secure Tree (HDST) implementation. This file includes mappings for post-quantum cryptographic algorithms
 * (ML-DSA, ML-KEM, SLH-DSA), traditional elliptic curves (Ed25519, X25519), and hashing algorithms (SHAKE, SHA3).
 * It also defines structural constants for trees (relationships, direction), networking environments, application topologies, and generic key derivations (context, purpose, schemas).
 * NOTE: This file is using JS libs for browser usage but will need a wrapper for WASM/native modules to ensure  performance.
 */
import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { kmac256, kmac256xof } from '@noble/hashes/sha3-addons.js';
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { slh_dsa_shake_128s, slh_dsa_shake_192s, slh_dsa_shake_256s } from '@noble/post-quantum/slh-dsa.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { shake256 } from '@noble/hashes/sha3.js';
/**
 * Defines the numerical identifiers for supported cryptographic schemes and algorithms,
 * including both post-quantum (e.g., ML-DSA, ML-KEM, SLH-DSA) and traditional algorithms.
 */
export const SCHEME_TYPES = {
	MASTER: 0,
	// Dilithium2 (Signature)
	ML_DSA_44: 1,
	Dilithium2: 1,
	// Dilithium3 (Signature)
	ML_DSA_65: 2,
	Dilithium3: 2,
	// Dilithium5 (Signature)
	ML_DSA_87: 3,
	dilithium5: 3,
	// SPHINCS+ 128-bit simple (Signature)
	SLH_DSA_128S: 4,
	sphincs_128: 4,
	// SPHINCS+ 256-bit simple (Signature)
	SLH_DSA_256S: 5,
	sphincs_256: 5,
	// Kyber-512 (KEM)
	ML_KEM_512: 6,
	kyber_512: 6,
	// Kyber-768 (KEM)
	ML_KEM_768: 7,
	kyber_768: 7,
	// Kyber-1024 (KEM)
	ML_KEM_1024: 8,
	kyber_1024: 8,
	// AES-256 or ChaCha20 keys
	SYMMETRIC_256: 9,
	// Symmetric keys for higher security
	SYMMETRIC_512: 10,
	// NONCE
	NONCE: 11,
	// SEED
	SEED: 12,
	// Edwards-curve Digital Signature Algorithm
	ED25519: 13,
	// Elliptic-curve Diffie–Hellman key exchange
	X25519: 14,
	// eXtended Merkle Signature Scheme
	XMSS: 15,
	// Leighton-Micali Signatures
	LMS: 16,
};
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
 * Provides direct mapping of predefined scheme numerical IDs to their
 * corresponding underlying imported core cryptography functions.
 */
export const SCHEMES_BY_ID = {
	[SCHEME_TYPES.ML_DSA_44]: ml_dsa44,
	[SCHEME_TYPES.ML_DSA_65]: ml_dsa65,
	[SCHEME_TYPES.ML_DSA_87]: ml_dsa87,
	[SCHEME_TYPES.ML_KEM_512]: ml_kem512,
	[SCHEME_TYPES.ML_KEM_768]: ml_kem768,
	[SCHEME_TYPES.ML_KEM_1024]: ml_kem1024,
	[SCHEME_TYPES.ED25519]: ed25519,
	[SCHEME_TYPES.X25519]: x25519,
	[SCHEME_TYPES.SLH_DSA_128S]: slh_dsa_shake_128s,
	[SCHEME_TYPES.SLH_DSA_256S]: slh_dsa_shake_256s,
};
/**
 * Specifies the derivation mode or behavior applied across the HD seed hierarchy.
 * E.g., CHAIN applies linked chaining logic to deterministic derivations.
 */
export const MODES = {
	DEFAULT: 0,
	CHAIN: 1,
};
// What is the object being used to create. A PRE-KEY -> KEY, KEY -> SEED,
/**
 * CONTEXT_INTENTION flags that define what type of outcome the current HDST derivation
 * targets, such as deriving a KEY or generating a new final SEED.
 */
export const CONTEXT_INTENTION = {
	SEED: 0,
	KEY: 1,
	NONCE: 2,
	FINAL_SEED: 3,
	KEYPAIR: 4,
	SECRET_KEY: 5,
};
// Purpose codes for key usage
/**
 * Designates the functional purpose of a key/seed within the HDST paths,
 * aligning with standard derivations for signing, exchanging, or standalone keys.
 */
export const PURPOSE = {
	// signing
	SIGN: 0,
	// Key Exchange
	KEY_EXCHANGE: 1,
	// Secret Key
	KEY: 2,
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
 * Specifies the hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
export const HASH_ALGORITHMS = {
	SHAKE_256: 0,
	// XOF ONLY
	KMAC_256: 1,
	KMAC_256_XOF: 1,
	SHA3_256: 2,
	SHA3_512: 3,
};
// Network identifiers
/**
 * Specifies the environment type (e.g., MAINNET, TESTNET, DEVNET) for creating
 * and separating networking scopes and validating derivations.
 */
export const CRYPTOCURRENCY_NETWORK_TYPES = {
	MAINNET: 0,
	TESTNET: 1,
	DEVNET: 2,
	UNKNOWN: 3,
	CUSTOM: 255,
};
/**
 * Distinct mapping for various cryptocurrency platforms and networks to allow
 * HD logic mapping onto universally recognizable names and paths.
 */
export const NETWORK_NAMES = {
	VIAT: 0,
	UW: 1,
	// Use on any network
	GENERIC: 2,
	WWW: 3,
	BITCOIN: 4,
	ETHEREUM: 5,
	SOLANA: 6,
	BNB: 7,
};
/**
 * Specifies the fixed byte sizes associated with the generated output seed
 * material corresponding to specific cryptographic scheme derivations.
 */
export const SEED_SIZES = {
	[SCHEME_TYPES.ML_KEM_512]: 64,
	[SCHEME_TYPES.ML_KEM_768]: 64,
	[SCHEME_TYPES.ML_KEM_1024]: 64,
	[SCHEME_TYPES.ML_DSA_44]: 32,
	[SCHEME_TYPES.ML_DSA_65]: 32,
	[SCHEME_TYPES.ML_DSA_87]: 32,
	[SCHEME_TYPES.SPHINCS_128S]: 48,
	[SCHEME_TYPES.SPHINCS_256S]: 64,
	[SCHEME_TYPES.SLH_DSA]: 48,
	[SCHEME_TYPES.SYMMETRIC_256]: 32,
	[SCHEME_TYPES.SYMMETRIC_512]: 64,
};
/**
 * Specifies standard base entropy lengths when generating the foundational
 * MASTER seed values that derive the rest of the HDST tree.
 */
export const MASTER_SEED_ENTROPY_SIZES = {
	default: 256,
	small: 128,
	tiny: 64,
};
/**
 * Specifies the allowed sizes in bytes for raw symmetric keys or
 * deterministic raw secret derivations in predefined environments.
 */
export const SECRET_KEY_SIZES = {
	single: 32,
	double: 64,
	quad: 128,
	key_32_bytes: 32,
	key_64_bytes: 64,
	key_128_bytes: 128,
	key_256_bytes: 256,
	key_512_bytes: 512,
	key_1024_bytes: 1024,
	key_2048_bytes: 2048,
};
/**
 * Configures the types of generalized software services/topologies that nodes,
 * wallets, or applications align with across the Universal/Network structure.
 */
export const SERVICE_TYPES = {
	APP: 0,
	WEBSITE: 1,
	UNIVERSAL: 3,
	NETWORK: 4,
	WALLET: 5,
};
/**
 * Specifies the underlying target network type for the derived application
 * profile mapping, distinguishing between blockchain usage and other constructs.
 */
export const SERVICE_NETWORK_TYPES = {
	CRYPTOCURRENCY: 0,
	AI: 1,
};
/**
 * Specifies the broader host application hardware environments or platform
 * classifications supported when deriving deterministic nodes or configurations.
 */
export const APP_PLATFORMS = {
	DESKTOP: 0,
	MOBILE: 1,
	UNIVERSAL: 2,
};
/**
 * Specifies the underlying nature or framework implementation style of
 * an application running on an APP_PLATFORM, useful for environment isolation.
 */
export const APP_TYPES = {
	NATIVE: 0,
	WEB: 1,
	HYBRID: 2,
};
/**
 * Distinct mapping for known operating systems interacting with the
 * networking features for specific node mapping or configurations.
 */
export const OPERATING_SYSTEMS = {
	UNIX: 0,
	BSD: 1,
	MACOS: 2,
	WINDOWS: 3,
	LINUX: 4,
	ANDROID: 5,
	IOS: 6,
	OTHER: 7,
};
/**
 * Dictates general brandings or manufacturer classes corresponding to
 * mobile operational states, typically for analytic or feature flags.
 */
export const MOBILE_BRANDS = {
	APPLE: 0,
	SAMSUNG: 1,
	GOOGLE: 2,
	ASUS: 3,
	OTHER: 4,
};
/**
 * Specifies the high-level functionalities or service interfaces
 * related to AI operations that can be attached to the tree structure.
 */
export const AI_TYPES = {
	AGENT: 0,
	ANALYTICS: 1,
	ASK: 2,
	EDIT: 3,
	PLAN: 4,
	CHATBOT: 5,
	API: 6,
};
/**
 * Distinct mapping defining specialized roles of AI agents operating
 * within the structured Viat environment.
 */
export const AI_AGENT_TYPES = {
	CODER: 0,
	WRITER: 1,
	ARTIST: 2,
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
 * Defines the default mapping structure used to assemble the Key (K)
 * parameter for KMAC operations, utilized to construct the final deterministic seed.
 */
export const DEFAULT_KEY_STRUCTURE = {
	scheme: SCHEME_TYPES.MASTER,
	context_intention: CONTEXT_INTENTION.FINAL_SEED,
	mode: MODES.DEFAULT,
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
const test = Object.create(DEFAULT_CUSTOMIZATION_NONCE_STRUCTURE);
test.domain = 'TEST';
console.log(test, DEFAULT_CUSTOMIZATION_NONCE_STRUCTURE);
const defaults = {
	OPERATING_SYSTEMS,
	APP_TYPES,
	APP_PLATFORMS,
	SERVICE_NETWORK_TYPES,
	SERVICE_TYPES,
	SECRET_KEY_SIZES,
	MASTER_SEED_ENTROPY_SIZES,
	SEED_SIZES,
	NETWORK_NAMES,
	CRYPTOCURRENCY_NETWORK_TYPES,
	DIRECTION,
	RELATIONSHIP,
	PURPOSE,
	CONTEXT_INTENTION,
	MODES,
	SCHEMES_BY_ID,
	SCHEME_TYPES,
	HASH_ALGORITHMS,
	MOBILE_BRANDS,
	AI_TYPES,
	AI_AGENT_TYPES,
	ENCODING_FORMATS,
	PROFILE_TYPES,
	STORAGE_SECURITY,
	RECOVERY_MODES,
	DERIVATION_TYPES,
	DEFAULT_SEED_STRUCTURE,
	DEFAULT_KEY_STRUCTURE,
	DEFAULT_CUSTOMIZATION_NONCE_STRUCTURE,
};
export default defaults;
// example();
