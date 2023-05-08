import {
	stringify,
	hasValue,
	get
} from 'Acid';
import {
	success, failed, imported, msgSent, msgReceived, info
} from '#logs';
import { Reply, createReply } from '#udsp/reply';
imported('ON PUBLIC MESSAGE');
export async function processPacketEvent(server, client, message) {
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
	createReply(message, client);
}
