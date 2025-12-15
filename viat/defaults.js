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
	! WEBSITE: https://viat.network https://universalweb.io
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
const version = '0.0.1';
const vanityVersion = '0.0.1';
const coinName = 'VIAT';
const coinNamePlural = 'VIAT';
const coinSymbol = '⩝';
// credits kreds units microns micros vits
const coinSmallestUnitName = 'units';
const coinLargestUnitName = 'VIAT';
const coinTicker = 'VIAT';
const coinUnitName = 'VIAT';
const coinElementName = 'Vitainium';
const coinElementSymbol = 'Vi';
const viatReserve = 'Viat Reserve';
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
const coinDecimalPlaces = 48;
const coinMaxSupplyDisplay = '10,000,000,000';
const coinMaxWholeSupplyString = coinMaxSupplyDisplay.replace(/,/g, '');
const coinMaxWholeSupplyNumber = Number(coinMaxWholeSupplyString);
const coinZeros = ''.padEnd(coinDecimalPlaces, '0');
const coinMaxSupplyString = `${coinMaxWholeSupplyString}${coinZeros}`;
const coinMaxSupplyAllString = `${coinMaxSupplyDisplay}.${coinZeros}`;
const coinMaxSupply = BigInt(coinMaxSupplyString);
const coinDigitCount = coinMaxSupplyString.length;
const coinWholeDigitCount = coinMaxWholeSupplyString.length;
const initialPreAllocationNumber = 4_200_000;
const initialPreAllocation = BigInt(`${initialPreAllocationNumber}${coinZeros}`);
/*
? ██╗  ██╗ █████╗ ███████╗██╗  ██╗    ██╗███╗   ██╗███████╗ ██████╗
? ██║  ██║██╔══██╗██╔════╝██║  ██║    ██║████╗  ██║██╔════╝██╔═══██╗
? ███████║███████║███████╗███████║    ██║██╔██╗ ██║█████╗  ██║   ██║
? ██╔══██║██╔══██║╚════██║██╔══██║    ██║██║╚██╗██║██╔══╝  ██║   ██║
? ██║  ██║██║  ██║███████║██║  ██║    ██║██║ ╚████║██║     ╚██████╔╝
? ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const defaultHashSize = 32;
const defaultNonceSize = 16;
const defaultQuantumHashSize = 64;
/*
~ ██╗    ██╗ █████╗ ██╗     ██╗     ███████╗████████╗    ██╗███╗   ██╗███████╗ ██████╗
~ ██║    ██║██╔══██╗██║     ██║     ██╔════╝╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
~ ██║ █╗ ██║███████║██║     ██║     █████╗     ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
~ ██║███╗██║██╔══██║██║     ██║     ██╔══╝     ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
~ ╚███╔███╔╝██║  ██║███████╗███████╗███████╗   ██║       ██║██║ ╚████║██║     ╚██████╔╝
~  ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
// console.log(coinMaxWholeSupplyString.length);
const reservedAddresses = {
	//  STATIC INT WALLET - MINT VIAT
	coinFoundry: 0,
	// STATIC INT WALLET - TOKEN/NFT ONLY
	nullVault: 1,
	// GENERATED WALLET - FEDERAL VIAT RESERVE FUND/VAULT
	// The Phoenix Treasury - The Viat Reclamation Fund
	reserveVault: 2,
	// GENERATED WALLET - TEAM ALLOCATION WALLET
	teamVault: 3,
	//  GENERATED WALLET - INITIAL ALLOCATION WALLET
	originVault: 4,
};
const wallets = {
	legacy: {
		// 20 or 24 bytes is typical for non-quantum addresses
		// 20 could still be considered for smaller simple use cases
		walletSize: 24,
		walletHashConfig: {
			outputLength: 24,
			outputEncoding: 'buffer',
		},
		cipherSuite: 0,
		signatureAlgo: 'ed25519',
		trapdoor: 'dilithium',
	},
	hybrid: {
		walletSize: 32,
		walletHashConfig: {
			outputLength: 32,
			outputEncoding: 'buffer',
		},
		cipherSuite: 1,
		signatureAlgo: 'ed25519+dilithium',
		trapdoor: 'sphincs',
	},
	quantum: {
		// ? [40, 48, 56, 64] < Beyond
		// It is likely that an address size less than 64 bytes is still viable for initial quantum needs
		walletSize: 64,
		walletHashConfig: {
			outputLength: 64,
			outputEncoding: 'buffer',
		},
		cipherSuite: 2,
		signatureAlgo: 'dilithium',
		trapdoor: 'sphincs',
	},
};
export const trapdoorTypes = {
	signature: 0,
	proof: 1,
	hashlock: 2,
};
export const HASH_ALGORITHMS = {
	SHAKE256: 0,
	SHA3_256: 1,
	SHA3_512: 2,
};
/*
* ██████╗ ███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗    ██╗███╗   ██╗███████╗ ██████╗
* ██╔══██╗██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝    ██║████╗  ██║██╔════╝██╔═══██╗
* ██████╔╝█████╗  ██║      ╚████╔╝ ██║     ██║     █████╗      ██║██╔██╗ ██║█████╗  ██║   ██║
* ██╔══██╗██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝      ██║██║╚██╗██║██╔══╝  ██║   ██║
* ██║  ██║███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗    ██║██║ ╚████║██║     ╚██████╔╝
* ╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const reserveTxPercentage = 0.01;
const reserveTxMin = 1n;
const reserveTxMax = 10n;
/*
^ ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
^ ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
^ █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║
^ ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║
^ ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║
^ ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝
*/
const viatDefaults = {
	coinDecimalPlaces,
	coinDigitCount,
	coinElementName,
	coinElementSymbol,
	coinLargestUnitName,
	coinMaxSupply,
	coinMaxSupplyAllString,
	coinMaxSupplyDisplay,
	coinMaxSupplyString,
	coinMaxWholeSupplyNumber,
	coinMaxWholeSupplyString,
	coinName,
	coinNamePlural,
	coinSmallestUnitName,
	coinSymbol,
	coinTicker,
	coinUnitName,
	coinWholeDigitCount,
	coinZeros,
	initialPreAllocation,
	initialPreAllocationNumber,
	reservedAddresses,
	version,
	viatReserve,
	defaultHashSize,
	defaultNonceSize,
	defaultQuantumHashSize,
	wallets,
	vanityVersion,
};
export default viatDefaults;
// console.log(viatDefaults);
console.log(`
	╔───────────────────────────────────────╗
	│     ██╗   ██╗██╗ █████╗ ████████╗     │
	│     ██║   ██║██║██╔══██╗╚══██╔══╝     │
	│     ██║   ██║██║███████║   ██║        │
	│     ╚██╗ ██╔╝██║██╔══██║   ██║        │
	│      ╚████╔╝ ██║██║  ██║   ██║        │
	│       ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝        │
	╚───────────────────────────────────────╝
	VERSION ${version} - MADE IN AMERICA
`);
/*
███╗   ███╗ █████╗ ██████╗ ███████╗    ██╗███╗   ██╗     █████╗ ███╗   ███╗███████╗██████╗ ██╗ ██████╗ █████╗
████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██║████╗  ██║    ██╔══██╗████╗ ████║██╔════╝██╔══██╗██║██╔════╝██╔══██╗
██╔████╔██║███████║██║  ██║█████╗      ██║██╔██╗ ██║    ███████║██╔████╔██║█████╗  ██████╔╝██║██║     ███████║
██║╚██╔╝██║██╔══██║██║  ██║██╔══╝      ██║██║╚██╗██║    ██╔══██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║██║     ██╔══██║
██║ ╚═╝ ██║██║  ██║██████╔╝███████╗    ██║██║ ╚████║    ██║  ██║██║ ╚═╝ ██║███████╗██║  ██║██║╚██████╗██║  ██║
╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝╚═╝  ╚═╝
*/
