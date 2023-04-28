import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, } from 'Acid';
imported('Request');
export async function request(requestObject) {
	const thisContext = this;
	const { packetIdGenerator } = this;
	const { requests } = thisContext;
	// sid is a Stream ID
	const sid = packetIdGenerator.get();
	requestObject.sid = sid;
	requestObject.t = Date.now();
	info(`Requested ${requestObject}`);
	await thisContext.send(requestObject);
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
