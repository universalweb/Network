import {
	hasValue,
	isBigInt,
	isNotNumber,
	isNotString,
	isNumber,
	noValue
} from '@universalweb/acid';
import { encode } from '#utilities/serialize';
import viatDefaults from '#viat/defaults';
const {
	coinDecimalPlaces, coinMaxSupply, coinMaxSupplyLength, coinMaxWholeSupplyLength, coinMaxSupplyDisplay, coinMaxSupplyInt
} = viatDefaults;
function displayAmount(bigInt) {
	if (!isBigInt(bigInt)) {
		return;
	}
	const str = bigInt.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '') || '0';
	return `${intPart}.${fracPart}`;
}
function displayAmountWithCommas(bigInt) {
	if (!isBigInt(bigInt)) {
		return;
	}
	const str = bigInt.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '') || '0';
	return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fracPart}`;
}
function formatUnitsWithCommas(value) {
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
function isValidFormattedNumber(str) {
	// Must only contain digits, commas, or at most one dot
	return (/^[\d,]*\.?\d*$/).test(str);
}
function normalizeFormattedNumber(str) {
	const cleaned = str.replace(/,/g, '').trim();
	if (!(/^\d*\.?\d*$/).test(cleaned)) {
		return;
	}
	return cleaned;
}
function isBigIntAboveMaxSupply(value) {
	if (hasValue(value)) {
		return value.toString().length >= coinMaxSupplyLength;
	}
	return false;
}
function isBigIntBelowMaxSupply(value) {
	return value.toString().length <= coinMaxSupplyLength;
}
function convertToBigIntSafely(value) {
	if (isNotString(value) && isNotNumber(value)) {
		return;
	}
	if (isValidFormattedNumber(value)) {
		const converted = BigInt(value);
		if (isBigIntBelowMaxSupply(converted)) {
			return converted;
		}
	}
	return;
}
function isValidAmount(source) {
	if (hasValue(source) && isBigInt(source) && isBigIntBelowMaxSupply(source)) {
		return true;
	}
	return false;
}
function parseUnits(displayStr) {
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
function normalizeConvertToBigInt(value) {
	return parseUnits(normalizeFormattedNumber(value));
}
function ensureZeroBigInt(source) {
	if (noValue(source)) {
		return 0n;
	}
	return source;
}
function toSmallestUnit(value) {
	if (isNotNumber(value) || !isFinite(value)) {
		return;
	}
	return parseUnits(value.toString());
}
function fromSmallestUnit(value) {
	const str = value.toString().padStart(coinDecimalPlaces + 1, '0');
	const intPart = str.slice(0, -coinDecimalPlaces);
	const fracPart = str.slice(-coinDecimalPlaces).replace(/0+$/, '');
	return fracPart ? `${intPart}.${fracPart}` : intPart;
}
function applyPercent(amount, percent) {
	return (amount * BigInt(percent)) / BigInt(10 ** coinDecimalPlaces);
}
function mod(a, b) {
	return a % b;
}
function divide(a, b) {
	if (b === 0n) {
		return;
	}
	return a / b;
}
function multiply(a, b) {
	return a * b;
}
function subtract(a, b) {
	if (b > a) {
		return;
	}
	return a - b;
}
function add(a, b) {
	return a + b;
}
const mathUtils = {
	displayAmount,
	parseUnits,
	applyPercent,
	mod,
	divide,
	multiply,
	subtract,
	add
};
// TODO: Consider SIMD/Bit ops instead
function bigIntToBuffer(bigInt) {
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
function bufferToBigInt(source) {
	if (Buffer.isBuffer(source)) {
		return BigInt(`0x${source.toString('hex')}`);
	}
	return;
}
function bufferToBigInt2(buf) {
	let result = 0n;
	for (const byte of buf) {
		result = (result << 8n) + BigInt(byte);
	}
	return result;
}
function getBigIntByteSize(bigint) {
	let bits = 0n;
	let n = bigint;
	while (n !== 0n) {
		n >>= 1n;
		bits++;
	}
	return Number((bits + 7n) / 8n);
}
export default mathUtils;
// console.log(getBigIntByteSize(coinMaxSupplyInt));
// console.log(bufferToBigInt(bigIntToBuffer(coinMaxSupplyInt)));
// console.log((await encode(coinMaxSupplyInt)).length);
// console.log((await encode(bigIntToBuffer(coinMaxSupplyInt))).length);
// console.log(isValidAmount(100000000000000000000000000000000000000000000000000000000000n), '100000000000000000000000000000000000000000000000000000000000'.length);
// console.log(toSmallestUnit(1), fromSmallestUnit(toSmallestUnit(1)));
// const amountA = 10000000000000000000000000000000000000000000000000000n;
// const amountB = 10000000000000000000000000000000000000000000000000000n;
// const total = add(amountA, amountB);
// console.log('Total:', displayAmount(total));
// console.log('0000000000000000000000000000000000000000000000000000'.length);
// console.log(parseUnits('1,000.0'), parseUnits('1000000000000000.0'));
// console.log(coinMaxSupplyInt, coinMaxSupply.length, displayAmountWithCommas(parseUnits(coinMaxSupplyDisplay)));
// console.log(coinMaxSupplyInt, coinMaxSupply.length, displayAmountWithCommas(normalizeConvertToBigInt('52,000,000.0002000000001')), parseUnits('52,000,000.0002000'));
