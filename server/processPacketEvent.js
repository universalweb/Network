import {
	stringify,
	hasValue,
	get
} from 'Acid';
import {
	success, failed, imported, msgSent, msgReceived, info
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
	} else if (evnt && act) {
		msgReceived(`Action & Event received ${act} & ${evnt}`);
	} else if (act) {
		msgReceived(`Action (Lower level event protocol action) received ${act}`);
	} else {
		msgReceived(`Event (Higher level application event) received ${evnt}`);
	}
	const eventName = act || evnt;
	const method = (act) ? actions.get(act) : events.get(evnt);
	if (method) {
		if (body) {
			if (hasValue(sid)) {
				info(`Request:${eventName} RequestID: ${sid}`);
				console.log(message.body);
				const response = {
					sid
				};
				console.log(socket);
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
