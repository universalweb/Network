import * as binaryFormat from 'cbor-x';
import { encode as encodeStrictRaw } from 'cbor2';
import { noValue } from '@universalweb/utilitylib';
// Can be optimized further by reusing encoder instances with pre-defined options & structures
// TODO: Require Stream support for large data sets
const {
	encode: encodeRaw,
	decode: decodeRaw,
	Decoder,
	Encoder,
} = binaryFormat;
// Enforce canonical encoding for signing/verification & crypto operations for key value pairs
const canonicalSerializationOptions = {
	cde: true,
};
const keyMap = {};
for (let i = 0; i < 256; i++) {
	keyMap[i] = i;
}
export const compactByteMapEncoder = new Encoder({
	keyMap,
	// Likely won't work for cbor-x yet but left for future reference
	canonical: true,
	cde: true,
});
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
		return encodeStrictRaw(data, canonicalSerializationOptions);
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
		return encodeStrictRaw(data, canonicalSerializationOptions);
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
const serialization = {
	encode,
	encodeStrict,
	decode,
	encodeStrictSync,
	encodeSync,
};
export default serialization;
