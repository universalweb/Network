import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue
} from 'Acid';
import { closeRequest } from '../closeRequest.js';
imported('Client ProcessMessage');
export async function processMessage(data) {
	const { packet } = data;
	const {
		headers,
		message,
		footer
	} = packet;
	const thisContext = this;
	const { requestQueue, } = thisContext;
	const {
		state,
		sid,
	} = message;
	if (state) {
		console.log(`STATE CODE: ${state}`);
	}
	if (message) {
		if (message.state === 3) {
			thisContext.close();
			return failed(`End event sent disconnected socket`);
		}
		if (hasValue(sid)) {
			info(`Stream ID: ${sid} ${stringify(message)}`);
			const askObject = requestQueue.get(sid);
			if (askObject) {
				const messageBody = await askObject.callback(message, headers);
				if (messageBody) {
					thisContext.send(messageBody, {
						sid
					});
				}
				if (askObject.state === 2) {
					requestQueue.delete(sid);
				}
			} else {
				return failed(`Invalid Stream Id given. ${stringify(message)}`);
			}
		} else if (message.watcher) {
			console.log('WATCHER', message);
		}
	} else {
		console.log('NO MESSAGE OBJECT', message);
	}
}

