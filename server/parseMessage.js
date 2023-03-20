import {
	encode,
	decode
} from 'msgpackr';
export function parseMessage(msgPack) {
	const request = decode(msgPack);
	if (request.head) {
		request.head = decode(request.head);
	}
	if (request.body) {
		request.body = decode(request.body);
	}
	return request;
}
