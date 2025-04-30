const version = 1;
const coinName = 'VIAT';
const coinAlias = 'V';
const coinSymbol = '⩝';
const coinSmallestUnitName = 'units';
const coinLargestUnitName = 'VIAT';
const coinTicker = 'VIAT';
const coinUnitName = 'VIAT';
const coinElementName = 'Vitanium';
// whole:8  decimal:56|69 total:64|77
// Used for -> for micro payments, nano transactions, quantum payments (ultra-fine granularity transactions), High-Frequency Trading Fees, Low-Value Use Cases, Layer-2 or Batching, Counterparty Compatibility, atomic swaps, Viat Federal Reserve Deflationary Mechanism
const coinDecimalPlaces = 69;
const coinMaxSupplyDisplay = '52,000,000.0';
const coinMaxWholeSupplyDisplay = '52000000';
const coinMaxSupply = `${coinMaxWholeSupplyDisplay}${'0'.padEnd(coinDecimalPlaces, '0')}`;
const coinDigitCount = coinMaxSupply.length;
const coinMaxSupplyLength = coinMaxSupply.length;
const coinMaxWholeSupplyLength = coinMaxWholeSupplyDisplay.length;
const coinMaxSupplyInt = BigInt(coinMaxSupply);
const coinMaxSupplyParsed = '52,000,000.0'.padEnd(coinDecimalPlaces, '0');
const viatDefaults = {
	coinAlias,
	coinDecimalPlaces,
	coinDigitCount,
	coinMaxSupply,
	coinMaxSupplyDisplay,
	coinMaxSupplyInt,
	coinMaxSupplyLength,
	coinMaxSupplyParsed,
	coinName,
	coinUnitName,
	coinSymbol,
	coinTicker,
	coinSmallestUnitName,
	coinLargestUnitName,
	version,
};
export default viatDefaults;
// console.log(coinDigitCount);
