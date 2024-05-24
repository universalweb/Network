import {
	isArray,
	isNotNumber
} from '@universalweb/acid';
import { destroy } from './request/destory.js';
export async function proccessProtocolHeader(source, header, rinfo) {
	const rpc = header[1];
	console.log(`Processing Protocol Packet RPC ${rpc}`);
	if (isNotNumber(rpc)) {
		source.destroy(3);
		return;
	}
	switch (rpc) {
		// Hello Packet
		case 0: {
			source.introHeader(header, rinfo);
			break;
		}
		// End Connection Packet
		case 1: {
			console.log('END RECEIVED');
			source.endHeader(header, rinfo);
			break;
		}
		// Discovery Packet to get the server's certificate
		case 2: {
			source.discoveryHeader(header, rinfo);
			break;
		}
		default: {
			console.trace('Unknown Protocol Packet', header, rinfo);
			break;
		}
	}
}
export async function proccessProtocolPacketHeader(source, header, rinfo) {
	console.log('Processing Protocol Packet Header', header);
	if (header && isArray(header)) {
		proccessProtocolHeader(source, header, rinfo);
	}
}
export async function proccessProtocolFrame(source, frame, header, rinfo) {
	const rpc = frame[1];
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
		default: {
			console.trace('Unknown Protocol Packet', frame, header, rinfo);
			break;
		}
	}
}
export async function proccessProtocolPacketFrame(source, frame, header, rinfo) {
	console.log('Processing Protocol Packet Frame');
	proccessProtocolFrame(source, frame, header, rinfo);
}
