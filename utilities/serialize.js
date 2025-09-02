import * as binaryFormat from 'cbor-x';
import { noValue } from '@universalweb/utilitylib';
const {
	encode: encodeRaw,
	decode: decodeRaw,
	Decoder: DecoderRaw,
} = binaryFormat;
// Enforce canonical encoding for signing/verification & crupto operations
const canonicalSerializationOptions = {
	canonical: true,
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
		return encodeRaw(data, canonicalSerializationOptions);
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
	encodeStrictSync,
	encodeSync,
};
export default serialization;
