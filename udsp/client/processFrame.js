import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue,
	isArray
} from '@universalweb/acid';
export async function processFrame(frame, header, client) {
	const { requestQueue } = client;
	if (!frame) {
		return console.trace(`Invalid Frame Received`);
	}
	if (isArray(frame) && frame.length) {
		const id = frame[0];
		if (id === false) {
			return;
		}
		const rpc = frame[1];
		console.log(frame);
		info(`Packet Received Stream ID: ${id}`);
		if (rpc) {
			console.log(`rpc CODE: ${rpc}`);
		}
		const askObject = requestQueue.get(id);
		if (askObject) {
			askObject.onFrame(frame, header);
		} else {
			console.trace(`Invalid Stream Id given no ask object with that ID. ${id}`);
			console.log(frame);
			console.log(requestQueue);
		}
	}
}

