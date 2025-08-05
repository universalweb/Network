import { encode } from '#utilities/serialize';
const version = 1;
const coinName = 'VIAT';
const coinNamePlural = 'VIAT';
const coinSymbol = '⩝';
const coinSmallestUnitName = 'units';
const coinLargestUnitName = 'VIAT';
const coinTicker = 'VIAT';
const coinUnitName = 'VIAT';
const coinElementName = 'Vitainium';
const coinElementSymbol = 'Vi';
const vFED = 'Viat Federal Reserve';
const defaultHashSize = 64;
const legacyHashSize = 32;
// Used for -> for micro payments, nano transactions, quantum payments (ultra-fine granularity transactions), High-Frequency Trading Fees, Low-Value Use Cases, Layer-2 or Batching, Counterparty Compatibility, atomic swaps, Viat Federal Reserve Deflationary Mechanism
//  DECIMAL DRAFT AMOUNT
// WHOLE NUM digit count is 8
// ALT DECIMAL amount 40
// ALT2 Decimal amount 50
const coinDecimalPlaces = 69;
const coinMaxSupplyDisplay = '42,000,000';
const coinMaxWholeSupplyString = '42000000';
const coinMaxWholeSupplyNumber = 42000000;
const coinZeros = ''.padEnd(coinDecimalPlaces, '0');
const coinMaxSupplyString = `${coinMaxWholeSupplyString}${coinZeros}`;
const coinMaxSupplyAllString = `${coinMaxSupplyDisplay}.${coinZeros}`;
const coinMaxSupply = BigInt(coinMaxSupplyString);
const coinDigitCount = coinMaxSupplyString.length;
const coinWholeDigitCount = coinMaxWholeSupplyString.length;
const initialPreAllocation = 5200000;
// console.log(coinMaxWholeSupplyString.length);
const reservedAddresses = {
	// INITIAL ALLOCATION AMOUNT
	genesisWallet: 0,
	mint: 1,
	reserve: 2,
	team: 3,
	// TOKEN/NFT ONLY
	burn: 4,
};
const reserveTxPercentage = 0.01;
const reserveTxMin = 1n;
const reserveTxMax = 10n;
const viatDefaults = {
	coinElementName,
	coinElementSymbol,
	vFED,
	coinNamePlural,
	coinDecimalPlaces,
	coinDigitCount,
	coinMaxSupply,
	coinMaxSupplyDisplay,
	coinWholeDigitCount,
	coinName,
	coinUnitName,
	coinSymbol,
	coinTicker,
	coinSmallestUnitName,
	coinLargestUnitName,
	version,
	reservedAddresses,
};
export default viatDefaults;
// console.log(coinDigitCount);
// MADE IN AMERICA
