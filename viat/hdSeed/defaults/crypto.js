import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { kmac256, kmac256xof } from '@noble/hashes/sha3-addons.js';
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { slh_dsa_shake_128s, slh_dsa_shake_192s, slh_dsa_shake_256s } from '@noble/post-quantum/slh-dsa.js';
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
	SPHINCS_128S: 4,
	// SPHINCS+ 256-bit simple (Signature)
	SLH_DSA_256S: 5,
	SPHINCS_256S: 5,
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
export const TRAPDOOR_SCHEME_TYPES = {
	ML_DSA_44: 0,
	ML_DSA_65: 1,
	ML_DSA_87: 2,
};
/**
 * Specifies the fixed byte sizes associated with the generated output seed
 * material corresponding to specific cryptographic scheme derivations.
 */
export const SEED_SIZES = {
	[SCHEME_TYPES.ML_KEM_512]: 32,
	[SCHEME_TYPES.ML_KEM_768]: 32,
	[SCHEME_TYPES.ML_KEM_1024]: 32,
	[SCHEME_TYPES.ML_DSA_44]: 32,
	[SCHEME_TYPES.ML_DSA_65]: 32,
	[SCHEME_TYPES.ML_DSA_87]: 32,
	[SCHEME_TYPES.SPHINCS_128S]: 32,
	[SCHEME_TYPES.SPHINCS_256S]: 32,
	[SCHEME_TYPES.SLH_DSA]: 32,
	[SCHEME_TYPES.SYMMETRIC_256]: 32,
	[SCHEME_TYPES.SYMMETRIC_512]: 64,
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
 * CONTEXT_INTENTION flags that define what type of outcome the current HDST derivation
 * targets, such as deriving a KEY or generating a new final SEED.
 * What is the object being used to create. A PRE-KEY -> KEY, KEY -> SEED,.
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
	// Trapdoor
	TRAPDOOR: 3,
};
/**
 * Specifies the hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
export const HASH_ALGORITHMS = {
	SHAKE_256: 1,
	SHA3_256: 2,
	SHA3_512: 3,
	BLAKE3: 4,
};
/**
 * Specifies the keyed hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
export const KEYED_HASH_ALGORITHMS = {
	KMAC_256_XOF: 1,
	KMAC_256: 2,
};
/**
 * Specifies the Extendable-output function XOF hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
export const XOF_HASH_ALGORITHMS = {
	SHAKE_256: 0,
	BLAKE3: 1,
};
export const USER_INPUT_HASH_ALGORITHMS = {
	ARGON2ID: 0,
};
/**
 * Specifies standard base entropy lengths when generating the foundational
 * MASTER seed values that derive the rest of the HDST tree.
 * All entropy pool sizes are in bytes, and the final seed output may be derived to a different size.
 */
export const MASTER_ENTROPY_POOL_SIZES = {
	MIN: 32,
	DEFAULT: 64,
	MID: 128,
	MAX: 256,
	BROWSER: 64,
};
export const ENTROPY_POOL_TYPE = {
	SEED: 0,
	KEY: 1,
	NONCE: 2,
	SALT: 3,
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
export const ARGON2ID_DEFAULTS = {
	SALT_SIZE: 32,
	MIN_SALT_SIZE: 16,
	INSTANCE_CONFIG: {
		// password: 'pass',
		// salt: buffer,
		parallelism: 1,
		iterations: 256,
		memorySize: 512,
		hashLength: 32,
		outputType: 'encoded',
	},
};
export default {
	SCHEME_TYPES,
	TRAPDOOR_SCHEME_TYPES,
	SEED_SIZES,
	SCHEMES_BY_ID,
	CONTEXT_INTENTION,
	PURPOSE,
	HASH_ALGORITHMS,
	KEYED_HASH_ALGORITHMS,
	XOF_HASH_ALGORITHMS,
	MASTER_ENTROPY_POOL_SIZES,
	SECRET_KEY_SIZES,
	ENTROPY_POOL_TYPE,
	USER_INPUT_HASH_ALGORITHMS,
};
