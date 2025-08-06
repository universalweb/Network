// Process Frame Packets
import {
	hasValue,
	isArray,
	isNumber,
	stringify,
} from '@universalweb/utilitylib';
import { onProtocolFrame } from '#udsp/onPacket/onProtocol';
export async function processFrame(frame, header, source, queue, rinfo) {
	const streamId = frame[0];
	source.logInfo(`Packet Received Stream ID: ${streamId}`);
	// TODO: Consider streamID to be undefined and RPC location to be the same see if can make this cleaner
	if (hasValue(streamId)) {
		if (streamId === false) {
			onProtocolFrame(source, frame, header, rinfo);
			return;
		}
		const requestObject = queue.get(streamId);
		if (requestObject) {
			requestObject.onFrame(frame, header, rinfo);
			return;
		} else {
			// TODO: Consider a new request format to have a standard directive to create a new request
			// Otherwise should include the new reply constructor
			source.logInfo('No Reply found returning false', frame);
			return false;
		}
	}
}
export async function onFrame(frame, header, source, queue, rinfo) {
	if (!frame) {
		source.logError(`Invalid Frame Received`);
		return;
	}
	if (isArray(frame) && frame.length) {
		return processFrame(frame, header, source, queue, rinfo);
	}
}
