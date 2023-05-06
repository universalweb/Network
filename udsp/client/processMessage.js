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
	const [headers, response, footer] = data;
	const thisContext = this;
	const { requestQueue, } = thisContext;
	const {
		state,
		sid,
	} = response;
	if (state) {
		console.log(`STATE CODE: ${state}`);
	}
	if (response) {
		if (response.state === 3) {
			thisContext.close();
			return failed(`End event sent disconnected socket`);
		}
		if (hasValue(sid)) {
			info(`Stream ID: ${sid} ${stringify(response)}`);
			const askObject = requestQueue.get(sid);
			if (askObject) {
				const responseBody = await askObject.callback(response, headers);
				if (responseBody) {
					thisContext.send(responseBody, {
						sid
					});
				}
				if (askObject.state === 2) {
					requestQueue.delete(sid);
				}
			} else {
				return failed(`Invalid Stream Id given. ${stringify(response)}`);
			}
		} else if (response.watcher) {
			console.log('WATCHER', response);
		}
	} else {
		console.log('NO RESPONSE OBJECT', response);
	}
}

