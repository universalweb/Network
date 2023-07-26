import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue
} from '@universalweb/acid';
export async function processMessage(packet, client) {
	const {
		header,
		message,
		footer
	} = packet;
	const { queue } = client;
	const {
		connectionClose,
		state,
		sid,
	} = message;
	info(`Packet Received Stream ID: ${sid}`);
	if (state) {
		console.log(`STATE CODE: ${state}`);
	}
	if (state === 3 || connectionClose) {
		client.close();
		return failed(`End event received from server disconnected closing client`);
	}
	// console.log(queue.keys());
	const askObject = queue.get(sid);
	if (askObject) {
		askObject.onPacket(packet);
	} else {
		failed(`Invalid Stream Id given no ask object with that ID. ${sid}`);
		console.log(message);
	}
}

