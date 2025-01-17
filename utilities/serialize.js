import * as msgPack from 'msgpackr';
import { noValue } from '@universalweb/acid';
const {
	encode: encodeRaw,
	decode: decodeRaw
} = msgPack;
export function decode(data) {
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
export function encode(data) {
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
