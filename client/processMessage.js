import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	stringify,
	hasValue
} from 'Acid';
imported('Client ProcessMessage');
export async function processMessage(response, headers) {
	const thisContext = this;
	const { requests, } = thisContext;
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
			info(`RequestID: ${sid} ${stringify(response)}`);
			const method = requests.get(sid);
			if (method) {
				const responseBody = await method(response, headers);
				if (responseBody) {
					thisContext.send(responseBody, {
						sid
					});
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

