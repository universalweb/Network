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
export default {
	NETWORK_NAMES,
	CRYPTOCURRENCY_NETWORK_TYPES,
};
