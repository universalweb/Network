import * as binaryFormat from 'cbor-x';
import { noValue } from '@universalweb/acid';
const {
	encode: encodeRaw,
	decode: decodeRaw
} = binaryFormat;
const canonicalSerializationOptions = {
	// Enforce canonical encoding for signing/verification
	canonical: true
};
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
export async function encodeStrict(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encodeRaw(data, canonicalSerializationOptions);
	} catch (error) {
		// console.error(error);
		return;
	}
}
const serialization = {
	encode,
	encodeStrict,
	decode,
};
export default serialization;
