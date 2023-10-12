import * as msgPack from 'msgpackr';
const {
	encode: encodeRaw,
	decode: decodeRaw
} = msgPack;
export function decode(data) {
	if (!data) {
		return false;
	}
	try {
		return decodeRaw(data);
	} catch (error) {
		// console.error(error);
		return false;
	}
}
export function encode(data) {
	if (!data) {
		return false;
	}
	try {
		return encodeRaw(data);
	} catch (error) {
		// console.error(error);
		return false;
	}
}
