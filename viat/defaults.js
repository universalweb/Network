const version = 1;
const coinName = 'VIAT';
const coinAlias = 'V';
const coinSymbol = '⩝';
const coinSmallestUnitName = 'units';
const coinLargestUnitName = 'VIAT';
const coinTicker = 'VIAT';
const coinUnitName = 'VIAT';
// whole:8  decimal:56 total:64
// ultra-fine granularity for micropayments - 64-digit Ints
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
