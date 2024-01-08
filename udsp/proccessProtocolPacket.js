import {
	isArray,
	isNotNumber
} from '@universalweb/acid';
import { destroy } from './request/destory.js';
export async function proccessProtocol(source, rpc, frame, header, rinfo) {
	console.log(`Processing Protocol Packet RPC ${rpc}`);
	if (isNotNumber(rpc)) {
		source.destroy(3);
		return;
	}
	switch (rpc) {
		// Hello Packet
		case 0: {
			source.intro(frame, header, rinfo);
			break;
		}
		// End Connection Packet
		case 1: {
			console.log('END RECEIVED');
			source.end(frame, header, rinfo);
			break;
		}
		// Discovery Packet to get the server's certificate
		case 2: {
			source.discovery(frame, header, rinfo);
			break;
		}
		default: {
			console.trace('Unknown Protocol Packet', frame, header, rinfo);
			break;
		}
	}
}
export async function proccessProtocolPacketFrame(source, frame, header, rinfo) {
	console.log('Processing Protocol Packet Frame');
	proccessProtocol(source, frame[1], frame, header, rinfo);
}
export async function proccessProtocolPacketHeader(source, frame, header, rinfo) {
	console.log('Processing Protocol Packet Header');
	if (header && isArray(header)) {
		proccessProtocol(source, header[1], frame, header, rinfo);
	}
}
