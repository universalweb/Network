import * as binaryFormat from 'cbor-x';
import {
	encode as encodeStrictRaw,
	decode as jsDecodeRaw,
	rfc8949EncodeOptions,
	Token,
	Type,
} from 'cborg';
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
const BIGINT_UINT64_LIMIT = 18446744073709551616n;
/*
	Native big-endian minimal byte string for a non-negative bigint (no Buffer — browser-safe).
	Empty array for zero, which is the canonical CBOR bignum encoding of 0.
*/
function bigIntToByteString(value) {
	if (value <= 0n) {
		return new Uint8Array(0);
	}
	let byteLength = 0;
	let measure = value;
	while (measure > 0n) {
		measure >>= 8n;
		byteLength++;
	}
	const bytes = new Uint8Array(byteLength);
	let remaining = value;
	for (let position = byteLength - 1; position >= 0; position--) {
		bytes[position] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return bytes;
}
/*
	Strict bigint encoder (RFC 8949 preferred serialization). Values inside CBOR's 64-bit basic
	range return null to defer to cborg's native major-0/1 encoder, so a bigint and the equal
	number emit IDENTICAL bytes — a conformant decoder in any language re-canonicalizes to the same
	bytes, keeping cross-language hashes stable. Only magnitudes beyond the 64-bit range — every
	realistic VIAT amount, up to 10^58 — become CBOR bignums (tag 2 unsigned / tag 3 negative), the
	sole canonical form for such values. cbor-x decodes those tags to bigint natively; values inside
	the basic range decode as number, so block value-field accessors coerce reads back to bigint.
*/
function strictBigintEncoder(value) {
	if (value >= 0n) {
		if (value < BIGINT_UINT64_LIMIT) {
			return null;
		}
		return [new Token(Type.tag, 2), new Token(Type.bytes, bigIntToByteString(value))];
	}
	if (value >= -BIGINT_UINT64_LIMIT) {
		return null;
	}
	/* CBOR tag 3: a negative bignum stores n, where the represented value is -1 - n. */
	return [new Token(Type.tag, 3), new Token(Type.bytes, bigIntToByteString((-value) - 1n))];
}
const strictEncodeOptions = Object.freeze({
	...rfc8949EncodeOptions,
	typeEncoders: {
		bigint: strictBigintEncoder,
	},
});
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
	encodeStrictBig,
	encodeStrictBigSync,
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
