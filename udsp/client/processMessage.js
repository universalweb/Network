import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue
} from '@universalweb/acid';
imported('Client ProcessMessage');
export async function processMessage(packet, client) {
	const {
		header,
		message,
		footer
	} = packet;
	const { queue } = client;
	const {
		state,
		sid,
	} = message;
	if (state) {
		console.log(`STATE CODE: ${state}`);
	}
	if (message) {
		if (message.state === 3) {
			client.close();
			return failed(`End event sent disconnected socket`);
		}
		if (hasValue(sid)) {
			info(`Stream ID: ${sid} ${stringify(message)}`);
			console.log(queue.keys());
			const askObject = queue.get(sid);
			if (askObject) {
				askObject.onPacket(packet);
			} else {
				return failed(`Invalid Stream Id given. ${stringify(message)}`);
			}
		}
	} else {
		console.log('NO MESSAGE OBJECT', packet);
	}
}

