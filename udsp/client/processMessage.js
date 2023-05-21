import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue
} from 'Acid';
imported('Client ProcessMessage');
export async function processMessage(packet, client) {
	const {
		headers,
		message,
		footer
	} = packet;
	const { requestQueue } = client;
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
			const askObject = requestQueue.get(sid);
			if (askObject) {
				const messageBody = await askObject.accept(packet);
				if (askObject.state === 2) {
					askObject.delete();
				}
			} else {
				return failed(`Invalid Stream Id given. ${stringify(message)}`);
			}
		}
	} else {
		console.log('NO MESSAGE OBJECT', packet);
	}
}

