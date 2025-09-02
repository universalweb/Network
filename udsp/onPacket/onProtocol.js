// Process Protocol Packets
import {
	discoveryHeaderRPC,
	endHeaderRPC,
	extendedSynchronizationHeaderRPC,
	introHeaderRPC,
} from '#udsp/rpc/headerRPC';
import {
	discoveryRPC,
	endRPC,
	extendedSynchronizationRPC,
	introRPC,
} from '#udsp/rpc/frameRPC';
import {
	isArray,
	isNotNumber,
	isUndefined,
	noValue,
} from '@universalweb/utilitylib';
export async function proccessProtocolHeader(rpc, source, header, packetDecoded, rinfo) {
	switch (rpc) {
		// Hello Packet
		case introHeaderRPC: {
			source.introHeader(header, packetDecoded, rinfo);
			break;
		}
		case extendedSynchronizationHeaderRPC: {
			source.extendedSynchronizationHeader(header, packetDecoded, rinfo);
			break;
		}
		// Discovery Packet to get the server's certificate
		case discoveryHeaderRPC: {
			source.discoveryHeader(header, packetDecoded, rinfo);
			break;
		}
		// End Connection Packet
		case endHeaderRPC: {
			source.logInfo('END RECEIVED');
			source.endHeader(header, packetDecoded, rinfo);
			break;
		}
		default: {
			console.trace('Unknown Protocol Packet', header, packetDecoded, rinfo);
			source.endHeader(header, packetDecoded, rinfo);
			break;
		}
	}
}
export async function onProtocolHeader(source, header, packetDecoded, rinfo) {
	source.logVerbose('Processing Protocol Header', header);
	const rpc = header[1];
	if (noValue(rpc) || isNotNumber(rpc)) {
		source.destroy(3);
		return;
	}
	if (header && isArray(header)) {
		// TODO: CHECK TO SEE IF CAN REMOVE RETURN
		return proccessProtocolHeader(rpc, source, header, packetDecoded, rinfo);
	}
}
export async function proccessProtocolFrame(rpc, source, frame, header, rinfo) {
	switch (rpc) {
		// Hello/Intro
		case introRPC: {
			source.logInfo('Hello/Intro RECEIVED');
			source.intro(frame, header, rinfo);
			break;
		}
		// Extended Synchronization
		case extendedSynchronizationRPC: {
			source.extendedSynchronization(frame, header, rinfo);
			break;
		}
		case discoveryRPC: {
			source.discovery(frame, header, rinfo);
			break;
		}
		// End Connection
		case endRPC: {
			source.logInfo('END RECEIVED');
			source.end(frame, header, rinfo);
			break;
		}
		default: {
			source.logError('Unknown Protocol RPC', rpc, frame, header, rinfo);
			source.end(frame, header, rinfo);
			break;
		}
	}
}
export async function onProtocolFrame(source, frame, header, rinfo) {
	const rpc = frame[1];
	source.logVerbose(`Processing Protocol FRAME RPC ${rpc}`);
	if (noValue(rpc) || isNotNumber(rpc)) {
		source.destroy(3);
		return;
	}
	if (rpc) {
		proccessProtocolFrame(rpc, source, frame, header, rinfo);
	}
}
