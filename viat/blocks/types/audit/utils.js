import { isArray, isNumber } from '@universalweb/utilitylib';
const keyStringMap = new WeakMap();
export function toLatin1(hash) {
	if (isNumber(hash)) {
		const charcode = String.fromCharCode(hash);
		return (charcode.length > 1) ? hash : charcode;
	}
	return (hash.toString) ? hash.toString('latin1') : String.fromCharCode(...hash);
}
export function toBase64(hash) {
	return (hash.toBase64) ? hash.toBase64() : hash.toString('base64');
}
export function toEncoding(hash) {
	return toLatin1(hash);
}
export function getKeyString(hash) {
	const keyString = keyStringMap.get(hash);
	if (keyString) {
		return keyString;
	}
	const newKeyString = toBase64(hash);
	keyStringMap.set(hash, newKeyString);
	return newKeyString;
}
export function removeKeyString(hash) {
	const newKeyString = toBase64(hash);
	keyStringMap.delete(newKeyString);
}
export function compareBuffers(bufferA, bufferB) {
	const answer = Buffer.compare(bufferA, bufferB);
	if (answer === 0) {
		return true;
	}
	return false;
}
// Add loop to check each buffer that has longest common prefix
export function commonPrefix(a, b, indexStart = 0) {
	let index = indexStart;
	const aLength = a.length;
	while (index < aLength && a[index] === b[index]) {
		index++;
	}
	return a.subarray(0, index);
}
export function insertSortedBuffer(array, buffer) {
	let high = array.length;
	if (high === 0) {
		return array.push(buffer) - 1;
	}
	let low = 0;
	while (low < high) {
		const mid = Math.floor((low + high) / 2);
		if (buffer.compare(array[mid]) < 0) {
			high = mid;
		} else {
			low = mid + 1;
		}
	}
	array.splice(low, 0, buffer);
	return low;
}
// export async function safeEncode(source) {
// 	if (isArray(source)) {
// 		const sortedArray = insertSortedBuffer([], source[0]);
// 	}
// 	return encodeStrict(source);
// }
