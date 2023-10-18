import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue,
	isArray
} from '@universalweb/acid';
export async function processMessage(packet, client) {
	const {
		header,
		message,
		footer
	} = packet;
	const { requestQueue } = client;
	if (!message) {
		return console.trace(`Invalid Message Received`);
	}
	const {
		kill,
		state,
		f: frame,
		id
	} = message;
	info(`Packet Received Stream ID: ${id}`);
	if (state) {
		console.log(`STATE CODE: ${state}`);
	}
	if (state === 3 || kill) {
		client.close();
		return console.trace(`End event received from server disconnected closing client`);
	}
	// console.log(queue.keys());
	const askObject = requestQueue.get(id);
	if (askObject) {
		askObject.onPacket(packet);
	} else {
		console.trace(`Invalid Stream Id given no ask object with that ID. ${id}`);
		console.log(message);
	}
}

