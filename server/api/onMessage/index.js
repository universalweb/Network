import {
	stringify,
	hasValue
} from 'Acid';
import {
	success, failed, imported, msgSent, info
} from 'utilities/logs.js';
imported('ON PUBLIC MESSAGE');
export async function onMessage(socket, message) {
	const { app, } = this;
	const {
		body,
		sid,
		api
	} = message;
	if (!api) {
		return failed(`Invalid no method name given. ${stringify(message)}`);
	}
	const method = app[api];
	if (method) {
		if (body) {
			if (hasValue(sid)) {
				info(`Request:${api} RequestID: ${sid}`);
				console.log(message.body);
				const response = {
					sid
				};
				const hasResponse = await method(socket, message, response);
				if (hasResponse) {
					socket.send(response);
				}
				return;
			} else {
				const eid = message.eid;
				if (hasValue(eid)) {
					success(`Request:${method} Emit ID:${eid} ${stringify(message)}`);
					return method(socket, body, message);
				} else {
					return failed(`Invalid Request type. No Emit ID was given. ${stringify(message)}`);
				}
			}
		} else {
			return failed(`Invalid Request no body was sent. ${stringify(message)}`);
		}
	} else {
		return failed(`Invalid method name given. ${stringify(message)}`);
	}
}
