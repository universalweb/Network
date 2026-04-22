import * as binaryFormat from 'cbor-x';
import { encode as encodeStrictRaw, decode as jsDecodeRaw, rfc8949EncodeOptions } from 'cborg';
import { noValue } from '@universalweb/utilitylib';
import runBench from './benchmark.js';
// TODO: Require Stream support for large data sets
const {
	encode: encodeRaw,
	decode: decodeRaw,
	Decoder,
	Encoder,
} = binaryFormat;
export async function decode(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return decodeRaw(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}
export function decodeSync(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return decodeRaw(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}
export async function encode(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encodeRaw(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}
export function encodeSync(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encodeRaw(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}
// NOTE: USED FOR SIGNING AND VERIFICATION KEEPS DATA IN A STRICT ORDER
export async function encodeStrict(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encodeStrictRaw(data, rfc8949EncodeOptions);
	} catch (error) {
		// console.error(error);
		return;
	}
}
export function encodeStrictSync(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encodeStrictRaw(data, rfc8949EncodeOptions);
	} catch (error) {
		// console.error(error);
		return;
	}
}
export function objectToMapRecursive(obj) {
	if (obj === null || typeof obj !== 'object') {
		// Base case: primitives
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => {
			return objectToMapRecursive(item);
		});
	}
	// Convert object to Map, recursively convert values
	const map = new Map();
	for (const [
		key,
		value,
	] of Object.entries(obj)) {
		// Try to parse key as integer
		const numKey = (/^\d+$/).test(key) ? parseInt(key, 10) : key;
		map.set(numKey, objectToMapRecursive(value));
	}
	return map;
}
// Used for cbor encoding of key value objects into [key, value] arrays
export function objectToArrayRecursive(obj) {
	if (obj === null || typeof obj !== 'object') {
		// Base case: primitives
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => {
			return objectToArrayRecursive(item);
		});
	}
	// Convert object to array, recursively convert values
	const arr = [];
	for (const [
		key,
		value,
	] of Object.entries(obj)) {
		// Try to parse key as integer
		arr.push([key, objectToArrayRecursive(value)]);
	}
	return arr;
}
export async function jsDecode(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return jsDecodeRaw(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}
const serialization = {
	encode,
	encodeStrict,
	decode,
	encodeStrictSync,
	encodeSync,
	jsDecode,
};
function benchmark() {
	const data = {
		name: 'Alice',
		age: 30,
		hobbies: [
			'reading', 'hiking', 'coding',
		],
		address: {
			street: '123 Main St',
			city: 'Anytown',
			country: 'USA',
		},
	};
	const buf1 = encodeStrictRaw(data, rfc8949EncodeOptions);
	const buf2 = encodeRaw(data);
	console.log(buf1);
	console.log(buf2);
	console.log(Buffer.compare(buf1, buf2));
	runBench(() => {
		encodeRaw({
			name: 'Alice',
			age: 30,
			hobbies: [
				'reading', 'hiking', 'coding',
			],
			address: {
				street: '123 Main St',
				city: 'Anytown',
				country: 'USA',
			},
		});
	}, () => {
		encodeStrict({
			name: 'Alice',
			age: 30,
			hobbies: [
				'reading', 'hiking', 'coding',
			],
			address: {
				street: '123 Main St',
				city: 'Anytown',
				country: 'USA',
			},
		});
	});
}
// benchmark();
export default serialization;
