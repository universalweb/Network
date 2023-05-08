import {
	encode,
	decode
} from 'msgpackr';
export function parsePacket(msgPack) {
	const request = decode(msgPack);
	return request;
}
