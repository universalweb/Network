import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import {
	slh_dsa_shake_128s,
	slh_dsa_shake_192s,
	slh_dsa_shake_256s,
} from '@noble/post-quantum/slh-dsa.js';
export const SCHEME_TYPES = {
	MASTER: 0,
	// Dilithium2 (Signature)
	ML_DSA_44: 1,
	// Dilithium3 (Signature)
	ML_DSA_65: 2,
	// Dilithium5 (Signature)
	ML_DSA_87: 3,
	// SPHINCS+ 128-bit simple (Signature)
	SLH_DSA_128S: 4,
	// SPHINCS+ 256-bit simple (Signature)
	SLH_DSA_256S: 5,
	// Kyber-512 (KEM)
	ML_KEM_512: 6,
	// Kyber-768 (KEM)
	ML_KEM_768: 7,
	// Kyber-1024 (KEM)
	ML_KEM_1024: 8,
	// AES-256 or ChaCha20 keys
	SYMMETRIC_256: 9,
	// Symmetric keys for higher security
	SYMMETRIC_512: 10,
	// NONCE
	NONCE: 11,
	// SEED
	SEED: 12,
	// eXtended Merkle Signature Scheme
	XMSS: 13,
	// Leighton-Micali Signatures
	LMS: 14,
};
export const SCHEMES_BY_ID = {
	[SCHEME_TYPES.ML_DSA_44]: ml_dsa44,
	[SCHEME_TYPES.ML_DSA_65]: ml_dsa65,
	[SCHEME_TYPES.ML_DSA_87]: ml_dsa87,
	[SCHEME_TYPES.ML_KEM_512]: ml_kem512,
	[SCHEME_TYPES.ML_KEM_768]: ml_kem768,
	[SCHEME_TYPES.ML_KEM_1024]: ml_kem1024,
	[SCHEME_TYPES.SLH_DSA]: {
		slh_dsa_shake_128s,
		slh_dsa_shake_192s,
		slh_dsa_shake_256s,
	},
};
const MODES = {
	DEFAULT: 0,
	CHAIN: 1,
};
export const CONTEXT = {
	SEED_MASTER: 0,
	SEED: 1,
	SECRET_KEY: 2,
	SECRET_NONCE: 3,
	SECRET_MASTER_KEY: 4,
};
// Purpose codes for key usage
export const KEY_PURPOSES = {
	// Scheme-specific master can be for any type of purpose
	MASTER: 0,
	// Transaction signing
	SIGNING: 1,
	// Message encryption
	ENCRYPTION: 2,
	// Identity authentication
	AUTHENTICATION: 3,
	// Further key derivation
	SEED: 4,
	MASTER_KEY: 5,
	NONCE: 6,
	SECRET_KEY: 7,
};
export const RELATIONSHIP = {
	MASTER: 0,
	CHILD: 1,
	SLAVE: 2,
};
export const HASH_ALGORITHMS = {
	SHAKE256: 0,
	SHA3_256: 1,
	SHA3_512: 2,
};
// Network identifiers
export const NETWORKS = {
	MAINNET: 0,
	TESTNET: 1,
	DEVNET: 2,
	UNKNOWN: 3,
	CUSTOM: 255,
};
export const NETWORK_NAMES = {
	VIAT: 0,
	UW: 1,
	// Use on any network
	GENERIC: 2,
	BITCOIN: 3,
	ETHEREUM: 4,
	SOLANA: 5,
	BNB: 6,
};
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
export const MASTER_SEED_ENTROPY_SIZES = {
	default: 256,
	small: 128,
	tiny: 64,
};
export const SECRET_KEY_SIZES = {
	single: 32,
	double: 64,
	quad: 128,
};
