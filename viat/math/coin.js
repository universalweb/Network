import {
	hasValue,
	isBigInt,
	isNotNumber,
	isNotString,
	isNumber,
	isString,
	noValue
} from '@universalweb/acid';
import { encode } from '#utilities/serialize';
import viatDefaults from '#viat/defaults';
const {
	coinDecimalPlaces, coinMaxSupply, coinMaxSupplyLength, coinMaxWholeSupplyLength, coinMaxSupplyDisplay, coinMaxSupplyInt
} = viatDefaults;
// TODO: Change API so that using strings is obvious or numbers or bigInt or unify them
// Already have smallest unit convert for math by removing period combine both sides then add the additional zeroes for full size
// or maybe do bitMath to merge into a singular number
export function displayAmount(bigInt) {
	if (!isBigInt(bigInt)) {
		return;
	}
	const str = bigInt.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '') || '0';
	return `${intPart}.${fracPart}`;
}
export function displayAmountWithCommas(bigInt) {
	if (!isBigInt(bigInt)) {
		return;
	}
	const str = bigInt.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '') || '0';
	return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fracPart}`;
}
export function formatUnitsWithCommas(value) {
	if (isNotString(value)) {
		return;
	}
	const str = value.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPartRaw = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '') || '0';
	// Add commas to integer part
	const intPart = intPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return `${intPart}.${fracPart}`;
}
export function isValidFormattedNumber(str) {
	// Must only contain digits, commas, or at most one dot
	return (/^[\d,]*\.?\d*$/).test(str);
}
export function normalizeFormattedNumber(str) {
	const cleaned = str.replace(/,/g, '').trim();
	if (!(/^\d*\.?\d*$/).test(cleaned)) {
		return;
	}
	return cleaned;
}
export function isBigIntAboveMaxSupply(value) {
	if (hasValue(value)) {
		return value.toString().length >= coinMaxSupplyLength;
	}
	return false;
}
export function isBigIntBelowMaxSupply(value) {
	return value.toString().length <= coinMaxSupplyLength;
}
export function convertToBigIntSafely(value) {
	if (isNumber(value)) {
		const converted = BigInt(value);
		if (isBigIntBelowMaxSupply(converted)) {
			return converted;
		}
	} else if (isString(value) && isValidFormattedNumber(value)) {
		const converted = BigInt(value);
		if (isBigIntBelowMaxSupply(converted)) {
			return converted;
		}
	}
	return;
}
export function isValidAmount(source) {
	if (hasValue(source) && isBigInt(source) && isBigIntBelowMaxSupply(source)) {
		return source >= 0n;
	}
	return false;
}
export function parseStringUnits(displayStr) {
	if (isNotString(displayStr) || !isValidFormattedNumber(displayStr)) {
		return;
	}
	const [
		intPart,
		fracPart = ''
	] = displayStr.replace(/,/g, '').trim().split('.');
	if (intPart.length > coinMaxWholeSupplyLength) {
		return;
	}
	const fullStr = intPart + fracPart.padEnd(coinDecimalPlaces, '0');
	const converted = BigInt(fullStr);
	if (isBigIntBelowMaxSupply(converted)) {
		return converted;
	}
}
export function normalizeConvertToBigInt(value) {
	return parseStringUnits(normalizeFormattedNumber(value));
}
export function ensureZeroBigInt(source) {
	if (noValue(source)) {
		return 0n;
	}
	return source;
}
export function toSmallestUnit(value) {
	if (isNumber(value)) {
		return parseStringUnits(value.toString());
	} else if (isString(value)) {
		return parseStringUnits(value);
	} else if (isBigInt(value)) {
		const strValue = value.toString();
		if (isBigIntBelowMaxSupply(value) && strValue.length <= coinMaxSupplyLength) {
			return value;
		}
	}
	return;
}
export function ensureSmallestUnit(value) {
	if (isNumber(value) && isFinite(value)) {
		const converted = convertToBigIntSafely(value);
		if (isBigInt(converted)) {
			return toSmallestUnit(converted);
		}
		return 0n;
	}
	if (isBigInt(value)) {
		return toSmallestUnit(value);
	}
	return 0n;
}
export function fromSmallestUnit(value) {
	const str = value.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '');
	return fracPart ? `${intPart}.${fracPart}` : intPart;
}
function getBigIntPercentage(value, percentage) {
	return (value * percentage) / 100n;
}
function getBigIntPercentageOf(part, whole) {
	const bigPart = part;
	const bigWhole = whole;
	if (bigWhole === 0n) {
		return;
	}
	return (bigPart * 100n) / bigWhole;
}
export function mod(a, b) {
	return a % b;
}
export function divide(a, b) {
	if (b === 0n || a === 0n) {
		return 0n;
	}
	return a / b;
}
export function multiply(a, b) {
	if (b === 0n || a === 0n) {
		return 0n;
	}
	return a * b;
}
export function exponent(a, b) {
	return a ** b;
}
export function subtract(a, b) {
	if (b > a) {
		return;
	}
	return a - b;
}
export function add(a, b) {
	return a + b;
}
// TODO: Consider SIMD/Bit ops instead
export function bigIntToBuffer(bigInt) {
	if (isBigInt(bigInt)) {
		return Buffer.from(bigInt.toString(16), 'hex');
	}
	return;
}
// function bigIntToBuffer(bigint, byteLength = 32) {
//   const buffer = Buffer.alloc(byteLength);
//   let temp = bigint;
//   for (let i = 0; i < byteLength; i++) {
//     buffer[byteLength - 1 - i] = Number(temp & 0xFFn);
//     temp >>= 8n;
//   }
//   return buffer;
// }
export function bufferToBigInt(source) {
	if (Buffer.isBuffer(source)) {
		return BigInt(`0x${source.toString('hex')}`);
	}
	return;
}
export function bufferToBigIntBit(buf) {
	let result = 0n;
	for (const byte of buf) {
		result = (result << 8n) + BigInt(byte);
	}
	return result;
}
export function getBigIntByteSize(bigint) {
	let bits = 0n;
	let n = bigint;
	while (n !== 0n) {
		n >>= 1n;
		bits++;
	}
	return Number((bits + 7n) / 8n);
}
const mathUtils = {
	displayAmount,
	parseStringUnits,
	getBigIntPercentage,
	mod,
	divide,
	multiply,
	subtract,
	add,
	getBigIntByteSize,
	bufferToBigInt,
	bufferToBigIntBit
};
export default mathUtils;
// console.log(getBigIntByteSize(coinMaxSupplyInt));
// console.log(bufferToBigInt(bigIntToBuffer(coinMaxSupplyInt)));
// console.log((await encode(coinMaxSupplyInt)).length);
// console.log((await encode(bigIntToBuffer(coinMaxSupplyInt))).length);
// console.log(isValidAmount(100000000000000000000000000000000000000000000000000000000000n), '100000000000000000000000000000000000000000000000000000000000'.length);
// console.log(getBigIntPercentageOf(20n, 200n), BigInt(10n ** 69n), toSmallestUnit(5.5), isValidAmount(0n), fromSmallestUnit(toSmallestUnit(999999)));
// const amountA = 10000000000000000000000000000000000000000000000000000n;
// const amountB = 10000000000000000000000000000000000000000000000000000n;
// const total = add(amountA, amountB);
// console.log('Total:', displayAmount(total));
// console.log('0000000000000000000000000000000000000000000000000000'.length);
// console.log(parseUnits('1,000.0'), parseUnits('1000000000000000.0'));
// console.log(coinMaxSupplyInt, coinMaxSupply.length, displayAmountWithCommas(parseUnits(coinMaxSupplyDisplay)));
// console.log(coinMaxSupplyInt, coinMaxSupply.length, displayAmountWithCommas(normalizeConvertToBigInt('52,000,000.0002000000001')), parseUnits('52,000,000.0002000'));
