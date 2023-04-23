import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, } from 'Acid';
imported('Request');
export async function request(api, body = null, head = {}) {
	const thisContext = this;
	const { packetIdGenerator } = this;
	const { requests } = thisContext;
	info(`Requested ${api}`);
	const sid = packetIdGenerator.get();
	await thisContext.send({
		body,
		head,
		api,
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
