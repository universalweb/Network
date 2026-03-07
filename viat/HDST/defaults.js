// This is using JS libs for generation but the actual implementation will be in WASM/native for performance and security
import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { kmac256, kmac256xof } from '@noble/hashes/sha3-addons.js';
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { slh_dsa_shake_128s, slh_dsa_shake_192s, slh_dsa_shake_256s } from '@noble/post-quantum/slh-dsa.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { shake256 } from '@noble/hashes/sha3.js';
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
export const OBJECT_TYPE = {
	PRE_SEED: 0,
	SEED: 1,
	PRE_KEY: 2,
	KEY: 3,
	PRE_NONCE: 4,
	NONCE: 5,
};
export const TRIE_OBJECT_TYPE = {
	root: 0,
	branch: 1,
	leaf: 2,
};
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
export const MODES = {
	DEFAULT: 0,
	CHAIN: 1,
};
// What is the object being used to create. A PRE-KEY -> KEY, KEY -> SEED,
export const CONTEXT = {
	SEED: 0,
	KEY: 1,
	NONCE: 2,
	FINAL_SEED: 3,
	KEYPAIR: 4,
	SECRET_KEY: 5,
};
// Purpose codes for key usage
export const PURPOSE = {
	// signing
	SIGN: 0,
	// Key Exchange
	KEY_EXCHANGE: 1,
	// Secret Key
	KEY: 2,
};
export const RELATIONSHIP = {
	PARENT: 0,
	CHILD: 1,
	BRANCH: 2,
	LEAF: 3,
	ROOT: 4,
};
export const DIRECTION = {
	HORIZONTAL: 0,
	VERTICAL: 1,
};
export const HASH_ALGORITHMS = {
	SHAKE_256: 0,
	// XOF ONLY
	KMAC_256: 1,
	KMAC_256_XOF: 1,
	SHA3_256: 2,
	SHA3_512: 3,
};
// Network identifiers
export const CRYPTOCURRENCY_NETWORK_TYPES = {
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
	WWW: 3,
	BITCOIN: 4,
	ETHEREUM: 5,
	SOLANA: 6,
	BNB: 7,
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
export const SERVICE_TYPES = {
	APP: 0,
	WEBSITE: 1,
	NEXUS: 2,
	UNIVERSAL: 3,
	NETWORK: 4,
};
export const SERVICE_NETWORK_TYPES = {
	CRYPTOCURRENCY: 0,
	AI: 1,
};
export const APP_PLATFORMS = {
	DESKTOP: 0,
	MOBILE: 1,
	UNIVERSAL: 2,
};
export const APP_TYPES = {
	NATIVE: 0,
	WEB: 1,
	HYBRID: 2,
};
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
export const MOBILE_BRANDS = {
	APPLE: 0,
	SAMSUNG: 1,
	GOOGLE: 2,
	ASUS: 3,
	OTHER: 4,
};
export const AI_TYPES = {
	AGENT: 0,
	ANALYTICS: 1,
	ASK: 2,
	EDIT: 3,
	PLAN: 4,
	CHATBOT: 5,
	API: 6,
};
export const AI_AGENT_TYPES = {
	CODER: 0,
	WRITER: 1,
	ARTIST: 2,
};
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
	CONTEXT,
	MODES,
	SCHEMES_BY_ID,
	SCHEME_TYPES,
	HASH_ALGORITHMS,
	MOBILE_BRANDS,
	AI_TYPES,
	AI_AGENT_TYPES,
};
export default defaults;
// example();
