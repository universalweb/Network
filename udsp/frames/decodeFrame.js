import { isArray, hasValue } from '@universalweb/acid';
export function decodeFrame(frame, frameDecoded = {}) {
	const [streamid, rpc, ...data] = frame;
	if (hasValue(rpc)) {
		frameDecoded.rpc = rpc;
	}
	if (hasValue(streamid)) {
		frameDecoded.streamid = streamid;
	}
	if (data) {
		if (data.length <= 1) {
			frameDecoded.data = data[0];
		} else {
			frameDecoded.data = data;
		}
	}
	return frameDecoded;
}
