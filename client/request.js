import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, } from 'Acid';
imported('Request');
export async function request(evnt, body = null, head = {}) {
	const thisContext = this;
	const { packetIdGenerator } = this;
	const { requests } = thisContext;
	info(`Requested ${evnt}`);
	const sid = packetIdGenerator.get();
	await thisContext.send({
		body,
		head,
		evnt,
		sid,
		t: Date.now(),
	});
	return promise((accept) => {
		requests.set(sid, (response, headers) => {
			accept({
				response,
				headers,
			});
			packetIdGenerator.free(sid);
		});
	});
}
