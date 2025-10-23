import { encode } from '#utilities/serialize';
/*
██╗   ██╗██╗ █████╗ ████████╗    ██╗███╗   ██╗███████╗ ██████╗
██║   ██║██║██╔══██╗╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
██║   ██║██║███████║   ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
╚██╗ ██╔╝██║██╔══██║   ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
 ╚████╔╝ ██║██║  ██║   ██║       ██║██║ ╚████║██║     ╚██████╔╝
  ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const version = 1;
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
███╗   ██╗██╗   ██╗███╗   ███╗██████╗ ███████╗██████╗ ███████╗
████╗  ██║██║   ██║████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔════╝
██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝███████╗
██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗╚════██║
██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║███████║
╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
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
██╗  ██╗ █████╗ ███████╗██╗  ██╗    ██╗███╗   ██╗███████╗ ██████╗
██║  ██║██╔══██╗██╔════╝██║  ██║    ██║████╗  ██║██╔════╝██╔═══██╗
███████║███████║███████╗███████║    ██║██╔██╗ ██║█████╗  ██║   ██║
██╔══██║██╔══██║╚════██║██╔══██║    ██║██║╚██╗██║██╔══╝  ██║   ██║
██║  ██║██║  ██║███████║██║  ██║    ██║██║ ╚████║██║     ╚██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const defaultHashSize = 32;
const defaultNonceSize = 16;
const defaultQuantumHashSize = 64;
/*
██╗    ██╗ █████╗ ██╗     ██╗     ███████╗████████╗    ██╗███╗   ██╗███████╗ ██████╗
██║    ██║██╔══██╗██║     ██║     ██╔════╝╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
██║ █╗ ██║███████║██║     ██║     █████╗     ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
██║███╗██║██╔══██║██║     ██║     ██╔══╝     ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
╚███╔███╔╝██║  ██║███████╗███████╗███████╗   ██║       ██║██║ ╚████║██║     ╚██████╔╝
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
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
/*
██████╗ ███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗    ██╗███╗   ██╗███████╗ ██████╗
██╔══██╗██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝    ██║████╗  ██║██╔════╝██╔═══██╗
██████╔╝█████╗  ██║      ╚████╔╝ ██║     ██║     █████╗      ██║██╔██╗ ██║█████╗  ██║   ██║
██╔══██╗██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝      ██║██║╚██╗██║██╔══╝  ██║   ██║
██║  ██║███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗    ██║██║ ╚████║██║     ╚██████╔╝
╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const reserveTxPercentage = 0.01;
const reserveTxMin = 1n;
const reserveTxMax = 10n;
/*
███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
█████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║
██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║
███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║
╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝
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
};
export default viatDefaults;
// console.log(viatDefaults);
// MADE IN AMERICA
