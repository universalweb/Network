/*
    & ╔───────────────────────────────────────╗
    & │     ██╗   ██╗██╗ █████╗ ████████╗     │
    & │     ██║   ██║██║██╔══██╗╚══██╔══╝     │
    & │     ██║   ██║██║███████║   ██║        │
    & │     ╚██╗ ██╔╝██║██╔══██║   ██║        │
    & │      ╚████╔╝ ██║██║  ██║   ██║        │
    & │       ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝        │
    & │     █████████████████████████████     │
    & ╚───────────────────────────────────────╝
    ? █████████████████████████████████████████
    ! VIAT is a post quantum cryptocurrency designed for indefinite scalability and security.
    ! VIAT utilizes a novel blockchain architecture and quantum-resistant cryptographic algorithms to ensure the integrity and longevity of the network.
    ! WEBSITE: https://viat.network https://viat.network
    ^ HASH ALGORITHM: SHAKE256
    ^ SIGNATURE ALGORITHMS: ED25519, DILITHIUM, SPHINCS+
    * KEY EXCHANGE ALGORITHMS: X25519, Kyber
    * AEAD ENCRYPTION: AEGIS-256, XChaCha20-Poly1305
    * ADDRESS SIZES: Legacy (24 bytes), Hybrid-Quantum (32 bytes), Quantum (40, 48, 56, 64 bytes)
    * ENCODING: CBOR
    * NETWORK PROTOCOL: UW:// → UDSP:// → UDP
    * WEB: UNIVERSAL WEB
*/
/*
    ! READ ME
    ~ VIAT CONFIG FILE FOR DEFAULT CONSTANTS AND SETTINGS
    ~ ANY CHANGES HERE ARE REFLECTED THROUGHOUT THE CODEBASE
    ~ ANY VALUES THAT ARE SYSTEMIC SHOULD BE LISTED HERE
*/
/*
    ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗███████╗
    ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
    ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   ███████╗
    ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
    ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   ███████║
    ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
*/
/*
! ██╗   ██╗██╗ █████╗ ████████╗    ██╗███╗   ██╗███████╗ ██████╗
! ██║   ██║██║██╔══██╗╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
! ██║   ██║██║███████║   ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
! ╚██╗ ██╔╝██║██╔══██║   ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
!  ╚████╔╝ ██║██║  ██║   ██║       ██║██║ ╚████║██║     ╚██████╔╝
!   ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const VERSION = '0.0.1';
const VANITY_VERSION = '0.0.1';
const COIN_NAME = 'VIAT';
const COIN_NAME_PLURAL = 'VIAT';
const COIN_SYMBOL = '⩝';
// credits kreds units microns micros vits
const COIN_SMALLEST_UNIT_NAME = 'UNITS';
const COIN_LARGEST_UNIT_NAME = 'VIAT';
const COIN_TICKER = 'VIAT';
const COIN_UNIT_NAME = 'VIAT';
const COIN_ELEMENT_NAME = 'Vitainium';
const COIN_ELEMENT_SYMBOL = 'Vi';
const VIAT_RESERVE = 'Viat Reserve';
/*
    * ███╗   ██╗██╗   ██╗███╗   ███╗██████╗ ███████╗██████╗ ███████╗
    * ████╗  ██║██║   ██║████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔════╝
    * ██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝███████╗
    * ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗╚════██║
    * ██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║███████║
    * ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
*/
// Used for -> for micro payments, nano transactions, quantum payments (ultra-fine granularity transactions), High-Frequency Trading Fees, Low-Value Use Cases, Layer-2 or Batching, Counterparty Compatibility, atomic swaps, Viat Reserve Deflationary Mechanism
//  DECIMAL DRAFT AMOUNT
// 32 40 48 56
const COIN_DECIMAL_PLACES = 48;
const COIN_MAX_SUPPLY_DISPLAY = '10,000,000,000';
const COIN_MAX_WHOLE_SUPPLY_STRING = COIN_MAX_SUPPLY_DISPLAY.replace(/,/g, '');
const COIN_MAX_WHOLE_SUPPLY_NUMBER = Number(COIN_MAX_WHOLE_SUPPLY_STRING);
const COIN_ZEROS = ''.padEnd(COIN_DECIMAL_PLACES, '0');
const COIN_MAX_SUPPLY_STRING = `${COIN_MAX_WHOLE_SUPPLY_STRING}${COIN_ZEROS}`;
const COIN_MAX_SUPPLY_ALL_STRING = `${COIN_MAX_SUPPLY_DISPLAY}.${COIN_ZEROS}`;
const COIN_MAX_SUPPLY = BigInt(COIN_MAX_SUPPLY_STRING);
const COIN_DIGIT_COUNT = COIN_MAX_SUPPLY_STRING.length;
const COIN_WHOLE_DIGIT_COUNT = COIN_MAX_WHOLE_SUPPLY_STRING.length;
const INITIAL_PRE_ALLOCATION_NUMBER = 4_200_000;
const INITIAL_PRE_ALLOCATION = BigInt(`${INITIAL_PRE_ALLOCATION_NUMBER}${COIN_ZEROS}`);
/*
    ? ██╗  ██╗ █████╗ ███████╗██╗  ██╗    ██╗███╗   ██╗███████╗ ██████╗
    ? ██║  ██║██╔══██╗██╔════╝██║  ██║    ██║████╗  ██║██╔════╝██╔═══██╗
    ? ███████║███████║███████╗███████║    ██║██╔██╗ ██║█████╗  ██║   ██║
    ? ██╔══██║██╔══██║╚════██║██╔══██║    ██║██║╚██╗██║██╔══╝  ██║   ██║
    ? ██║  ██║██║  ██║███████║██║  ██║    ██║██║ ╚████║██║     ╚██████╔╝
    ? ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const DEFAULT_HASH_SIZE = 32;
const DEFAULT_NONCE_SIZE = 16;
const DEFAULT_QUANTUM_HASH_SIZE = 64;
/*
    ~ ██╗    ██╗ █████╗ ██╗     ██╗     ███████╗████████╗    ██╗███╗   ██╗███████╗ ██████╗
    ~ ██║    ██║██╔══██╗██║     ██║     ██╔════╝╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
    ~ ██║ █╗ ██║███████║██║     ██║     █████╗     ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
    ~ ██║███╗██║██╔══██║██║     ██║     ██╔══╝     ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
    ~ ╚███╔███╔╝██║  ██║███████╗███████╗███████╗   ██║       ██║██║ ╚████║██║     ╚██████╔╝
    ~  ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
// console.log(COIN_MAX_WHOLE_SUPPLY_STRING.length);
const RESERVED_ADDRESSES = {
	//  STATIC INT WALLET - MINT VIAT
	COIN_FOUNDRY: 0,
	// STATIC INT WALLET - TOKEN/NFT ONLY
	NULL_VAULT: 1,
	// GENERATED WALLET - FEDERAL VIAT RESERVE FUND/VAULT
	// The Phoenix Treasury - The Viat Reclamation Fund
	RESERVE_VAULT: 2,
	// GENERATED WALLET - TEAM ALLOCATION WALLET
	TEAM_VAULT: 3,
	//  GENERATED WALLET - INITIAL ALLOCATION WALLET
	ORIGIN_VAULT: 4,
};
const WALLETS = {
	LEGACY: {
		// 20 or 24 bytes is typical for non-quantum addresses
		// 20 could still be considered for smaller simple use cases
		WALLET_SIZE: 24,
		WALLET_HASH_CONFIG: {
			outputLength: 24,
			outputEncoding: 'buffer',
		},
		CIPHER_SUITE: 0,
		SIGNATURE_ALGO: 'ed25519',
		TRAPDOOR: 'dilithium',
	},
	HYBRID: {
		WALLET_SIZE: 32,
		WALLET_HASH_CONFIG: {
			outputLength: 32,
			outputEncoding: 'buffer',
		},
		CIPHER_SUITE: 1,
		SIGNATURE_ALGO: 'ed25519+dilithium',
		TRAPDOOR: 'sphincs',
	},
	QUANTUM: {
		// ? [40, 48, 56, 64] < Beyond
		// It is likely that an address size less than 64 bytes is still viable for initial quantum needs
		WALLET_SIZE: 64,
		WALLET_HASH_CONFIG: {
			outputLength: 64,
			outputEncoding: 'buffer',
		},
		CIPHER_SUITE: 2,
		SIGNATURE_ALGO: 'dilithium',
		TRAPDOOR: 'sphincs',
	},
};
export const TRAPDOOR_TYPES = {
	SIGNATURE: 0,
	PROOF: 1,
	HASHLOCK: 2,
};
export const HASH_ALGORITHMS = {
	SHAKE_256: 0,
	SHA3_256: 1,
	SHA3_512: 2,
	KMAC_256: 3,
	KMAC_256_STRICT: 4,
};
/*
* ██████╗ ███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗    ██╗███╗   ██╗███████╗ ██████╗
* ██╔══██╗██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝    ██║████╗  ██║██╔════╝██╔═══██╗
* ██████╔╝█████╗  ██║      ╚████╔╝ ██║     ██║     █████╗      ██║██╔██╗ ██║█████╗  ██║   ██║
* ██╔══██╗██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝      ██║██║╚██╗██║██╔══╝  ██║   ██║
* ██║  ██║███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗    ██║██║ ╚████║██║     ╚██████╔╝
* ╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const RESERVE_TX_PERCENTAGE = 0.01;
const RESERVE_TX_MIN = 1n;
const RESERVE_TX_MAX = 10n;
/*
^ ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
^ ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
^ █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║
^ ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║
^ ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║
^ ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝
*/
const VIAT_DEFAULTS = {
	COIN_DECIMAL_PLACES,
	COIN_LARGEST_UNIT_NAME,
	COIN_MAX_SUPPLY,
	COIN_MAX_SUPPLY_ALL_STRING,
	COIN_MAX_SUPPLY_DISPLAY,
	COIN_MAX_SUPPLY_STRING,
	COIN_MAX_WHOLE_SUPPLY_NUMBER,
	COIN_MAX_WHOLE_SUPPLY_STRING,
	COIN_NAME,
	COIN_NAME_PLURAL,
	COIN_SMALLEST_UNIT_NAME,
	COIN_SYMBOL,
	COIN_TICKER,
	COIN_UNIT_NAME,
	COIN_WHOLE_DIGIT_COUNT,
	COIN_ZEROS,
	INITIAL_PRE_ALLOCATION,
	INITIAL_PRE_ALLOCATION_NUMBER,
	RESERVED_ADDRESSES,
	VERSION,
	VIAT_RESERVE,
	DEFAULT_HASH_SIZE,
	DEFAULT_NONCE_SIZE,
	DEFAULT_QUANTUM_HASH_SIZE,
	WALLETS,
	VANITY_VERSION,
};
export default VIAT_DEFAULTS;
// console.log(VIAT_DEFAULTS);
console.log(`
╔──────────────────⩝────────────────────╗
│     ██╗     ██╗ ██╗ █████╗ ████████╗  │
│     ██║     ██║ ██║██╔══██╗╚══██╔══╝  │
│     ██║     ██║ ██║███████║   ██║     │
│     ╚██╗   ██╔╝ ██║██╔══██║   ██║     │
│      ╚██████╔╝  ██║██║  ██║   ██║     │
│       ╚═════╝   ╚═╝╚═╝  ╚═╝   ╚═╝     │
╚────────────MADE IN AMERICA────────────╝
NAME: ${COIN_NAME}
TICKER: ${COIN_TICKER}
SYMBOL: ${COIN_SYMBOL}
VERSION: ${VERSION}${COIN_SYMBOL}
SMALLEST UNIT NAME: ${COIN_SMALLEST_UNIT_NAME}
LARGEST UNIT NAME: ${COIN_LARGEST_UNIT_NAME}
ELEMENT NAME: ${COIN_ELEMENT_NAME} (${COIN_ELEMENT_SYMBOL})

 ████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗ ██████╗ ███╗   ███╗██╗ ██████╗███████╗
 ╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔═══██╗████╗ ████║██║██╔════╝██╔════╝
    ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║██║   ██║██╔████╔██║██║██║     ███████╗
    ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██║   ██║██║╚██╔╝██║██║██║     ╚════██║
    ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║╚██████╗███████║
    ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝ ╚═════╝╚══════╝
                                                                                   
MAX SUPPLY: ${COIN_MAX_SUPPLY_ALL_STRING} ${COIN_SYMBOL}
DECIMAL PLACES: ${COIN_DECIMAL_PLACES}
MAX SUPPLY INT: ${COIN_MAX_SUPPLY}
INITIAL PRE-ALLOCATION: ${INITIAL_PRE_ALLOCATION_NUMBER.toLocaleString()} ${COIN_SYMBOL}
`);
/*
! ███╗   ███╗ █████╗ ██████╗ ███████╗    ██╗███╗   ██╗
  ████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██║████╗  ██║
? ██╔████╔██║███████║██║  ██║█████╗      ██║██╔██╗ ██║
! ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝      ██║██║╚██╗██║
  ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗    ██║██║ ╚████║
? ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═╝╚═╝  ╚═══╝
! ██╗   ██╗   ███████╗    █████╗
  ██║   ██║   ██╔════╝   ██╔══██╗
? ██║   ██║   ███████╗   ███████║
! ██║   ██║   ╚════██║   ██╔══██║
  ╚██████╔╝██╗███████║██╗██║  ██║██╗
?  ╚═════╝ ╚═╝╚══════╝╚═╝╚═╝  ╚═╝╚═╝
*/
