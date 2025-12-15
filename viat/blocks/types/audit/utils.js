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
function compareAllBuffer(a, b) {
	if (a.length < b.length) {
		return -1;
	}
	if (a.length > b.length) {
		return 1;
	}
	return a.compare(b);
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
// Binary Search for Buffer in sorted array of Buffers with the same size
export function binaryArraySearch(array, target) {
	let high = array.length;
	if (high === 0) {
		return;
	}
	high--;
	let low = 0;
	const initialFirstCompare = array[0].compare(target);
	if (initialFirstCompare === 0) {
		return 0;
	}
	const initialLastCompare = array[high].compare(target);
	if (initialLastCompare === 0) {
		return high;
	}
	let count = 0;
	low = 1;
	high--;
	while (low <= high) {
		count++;
		const mid = (low + high) >> 1;
		// console.log('comparing', array[mid]);
		const condition = array[mid].compare(target);
		if (condition === 0) {
			// console.log('binary search iterations:', count);
			return mid;
		}
		if (condition > 0) {
			high = mid - 1;
		} else {
			low = mid + 1;
		}
	}
	// console.log('binary search iterations:', count);
	return false;
}
// Quick Binary Insert that avoids duplicates. Checks first and last elements first for speed.
export function insertSortedBuffer(array, sourceBuffer) {
	let high = array.length;
	if (high === 0) {
		return array.push(sourceBuffer) - 1;
	}
	high--;
	let low = 0;
	const initialFirstCompare = array[0].compare(sourceBuffer);
	if (initialFirstCompare === 1) {
		array.unshift(sourceBuffer);
		return 0;
	} else if (initialFirstCompare === 0) {
		return false;
	}
	const initialLastCompare = array[high].compare(sourceBuffer);
	if (initialLastCompare === -1) {
		return array.push(sourceBuffer) - 1;
	} else if (initialLastCompare === 0) {
		return false;
	}
	low = 1;
	high--;
	let count = 0;
	while (low <= high) {
		count++;
		const mid = (low + high) >> 1;
		const source = array[mid];
		// console.log('comparing', array[mid], mid, high, low);
		const compareResult = array[mid].compare(sourceBuffer);
		if (compareResult === 0) {
			// No duplicates allowed
			return false;
		}
		if (compareResult > 0) {
			high = mid - 1;
		} else {
			low = mid + 1;
		}
	}
	// console.log('inserting at', low);
	// console.log('binary search iterations:', count);
	// console.log('inserting', low, high, array[low], sourceBuffer);
	array.splice(low, 0, sourceBuffer);
	return low;
}
function logBytes(buffer) {
	const arrayBytes = [];
	for (const byte of buffer) {
		arrayBytes.push(byte);
	}
	console.log(arrayBytes);
}
function exampleTest() {
	const hash4Example = Buffer.from('AEB');
	const hash3Example = Buffer.from('TEB');
	const hash2Example = Buffer.from('TEG');
	const hashExample = Buffer.from('TES');
	const list = [
		hash4Example, hash3Example, hash2Example, Buffer.from('TEI'), hashExample,
	];
	const hash5Example = Buffer.from('TEH');
	logBytes(hash4Example);
	logBytes(hash5Example);
	logBytes(hashExample);
	console.log(hash4Example.compare(hash5Example));
	console.log(list);
	console.log(hash5Example, insertSortedBuffer(list, hash5Example), list);
	console.log(binaryArraySearch(list, hashExample));
	const exampleList = [];
	for (let i = 10; i < 50; i++) {
		console.log('inserting', i, i.toString(), Buffer.from(i.toString()));
		if (i !== 11 && i !== 15) {
			exampleList.push(Buffer.from(i.toString()));
		}
	}
	console.log(exampleList, Buffer.from('18'));
	console.log('insertSortedBuffer', insertSortedBuffer(exampleList, Buffer.from('15')));
	console.log(exampleList);
	console.log(binaryArraySearch(exampleList, Buffer.from('27')));
	// export async function safeEncode(source) {
	// 	if (isArray(source)) {hash5Example
	// 		const sortedArray = insertSortedBuffer([], source[0]);
	// 	}
	// 	return encodeStrict(source);
	// }
}
// exampleTest();
