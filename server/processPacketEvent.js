import {
	stringify,
	hasValue,
	get
} from 'Acid';
import {
	success, failed, imported, msgSent, info
} from '#logs';
imported('ON PUBLIC MESSAGE');
export async function processPacketEvent(server, socket, message) {
	const {
		events,
		actions
	} = server;
	const {
		body,
		sid,
		evnt,
		act
	} = message;
	if (!evnt && !act) {
		return failed(`Invalid no EVNT (evnt) or Action (act) name given. ${stringify(message)}`);
	}
	const method = (act) ? actions.get(act) : events.get(evnt);
	if (method) {
		if (body) {
			if (hasValue(sid)) {
				info(`Request:${evnt} RequestID: ${sid}`);
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
