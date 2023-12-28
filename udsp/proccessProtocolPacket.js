import {
	isArray,
	isNotNumber
} from '@universalweb/acid';
import { destroy } from './request/destory.js';
export async function proccessProtocol(source, rpc, frame, header) {
	console.log(`Processing Protocol Packet RPC ${rpc}`);
	if (isNotNumber(rpc)) {
		source.destroy('Invalid RPC Not a Number');
		return;
	}
	switch (rpc) {
		// Hello Packet
		case 0: {
			source.intro(frame, header);
			break;
		}
		// End Connection Packet
		case 1: {
			source.end(frame, header);
			break;
		}
		// Discovery Packet to get the server's certificate
		case 2: {
			source.discovery(frame, header);
			break;
		}
		default: {
			console.trace('Unknown Protocol Packet', frame, header);
			break;
		}
	}
}
export async function proccessProtocolPacketFrame(source, frame, header) {
	console.log('Processing Protocol Packet Frame');
	proccessProtocol(source, frame[1], frame, header);
}
export async function proccessProtocolPacketHeader(source, frame, header) {
	console.log('Processing Protocol Packet Header');
	if (header && isArray(header)) {
		proccessProtocol(source, header[1], frame, header);
	}
}
