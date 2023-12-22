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
import { proccessProtocolPacketFrame } from '#udsp/proccessProtocolPacket';
export async function processFrame(frame, header, source, queue) {
	if (!frame) {
		return console.trace(`Invalid Frame Received`);
	}
	if (isArray(frame) && frame.length) {
		const streamId = frame[0];
		info(`Packet Received Stream ID: ${streamId}`);
		if (hasValue(streamId)) {
			if (streamId === false) {
				proccessProtocolPacketFrame(source, frame, header);
				return;
			}
			const requestObject = queue.get(streamId);
			if (requestObject) {
				requestObject.onFrame(frame, header);
				return;
			} else {
				console.log('None found returning false', frame);
				return false;
			}
		}
	}
}

