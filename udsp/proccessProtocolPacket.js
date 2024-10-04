import {
	isArray,
	isNotNumber
} from '@universalweb/acid';
import { destroy } from './request/destory.js';
export async function proccessProtocolHeader(source, header, packetDecoded, rinfo) {
	const rpc = header[1];
	console.log(`Processing Protocol Packet RPC ${rpc}`);
	if (isNotNumber(rpc)) {
		source.destroy(3);
		return;
	}
	switch (rpc) {
		// Hello Packet
		case 0: {
			source.introHeader(header, packetDecoded, rinfo);
			break;
		}
		// End Connection Packet
		case 1: {
			console.log('END RECEIVED');
			source.endHeader(header, packetDecoded, rinfo);
			break;
		}
		// Discovery Packet to get the server's certificate
		case 2: {
			source.discoveryHeader(header, packetDecoded, rinfo);
			break;
		}
		default: {
			console.trace('Unknown Protocol Packet', header, packetDecoded, rinfo);
			break;
		}
	}
}
export async function proccessProtocolPacketHeader(source, header, packetDecoded, rinfo) {
	console.log('Processing Protocol Packet Header', header);
	if (header && isArray(header)) {
		proccessProtocolHeader(source, header, packetDecoded, rinfo);
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
		// Hello/Intro
		case 0: {
			console.log('Hello/Intro RECEIVED');
			source.intro(frame, header, rinfo);
			break;
		}
		// End Connection
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
