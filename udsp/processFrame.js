// Process Frame Packets
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import {
	hasValue,
	isArray,
	isNumber,
	stringify
} from '@universalweb/acid';
import { proccessProtocolFrame } from '#udsp/proccessProtocol';
export async function processFrame(frame, header, source, queue, rinfo) {
	if (!frame) {
		return console.trace(`Invalid Frame Received`);
	}
	if (isArray(frame) && frame.length) {
		const streamId = frame[0];
		info(`Packet Received Stream ID: ${streamId}`);
		// TODO: Consider streamID to be undefined and RPC location to be the same see if can make this cleaner
		if (hasValue(streamId)) {
			if (streamId === false) {
				proccessProtocolFrame(source, frame, header, rinfo);
				return;
			}
			const requestObject = queue.get(streamId);
			if (requestObject) {
				requestObject.onFrame(frame, header, rinfo);
				return;
			} else {
				source.logInfo('No Reply found returning false', frame);
				return false;
			}
		}
	}
}

