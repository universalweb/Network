import {
	discoveryHeaderRPC,
	endHeaderRPC,
	extendedHandshakeHeaderRPC,
	introHeaderRPC
} from './protocolHeaderRPCs.js';
import {
	discoveryRPC,
	endRPC,
	extendedHandshakeRPC,
	introRPC
} from './protocolFrameRPCs.js';
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
		case introHeaderRPC: {
			source.introHeader(header, packetDecoded, rinfo);
			break;
		}
		case extendedHandshakeHeaderRPC: {
			source.extendedHandshakeHeader(header, packetDecoded, rinfo);
			break;
		}
		// Discovery Packet to get the server's certificate
		case discoveryHeaderRPC: {
			source.discoveryHeader(header, packetDecoded, rinfo);
			break;
		}
		// End Connection Packet
		case endHeaderRPC: {
			console.log('END RECEIVED');
			source.endHeader(header, packetDecoded, rinfo);
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
		case introRPC: {
			console.log('Hello/Intro RECEIVED');
			source.intro(frame, header, rinfo);
			break;
		}
		case extendedHandshakeRPC: {
			source.extendedHandshake(frame, header, rinfo);
			break;
		}
		case discoveryRPC: {
			source.discovery(frame, header, rinfo);
			break;
		}
		// End Connection
		case endRPC: {
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
