import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct } from 'Acid';
imported('Request');
class Ask {
	constructor(payload, thisContext) {
		const askContext = this;
		const timeStamp = Date.now();
		const {
			requestQueue,
			packetIdGenerator
		} = thisContext;
		// sid is a Stream ID
		const sid = packetIdGenerator.get();
		payload.sid = sid;
		payload.t = timeStamp;
		askContext.payload = payload;
		const awaitingResult = promise((accept) => {
			askContext.accept = accept;
		});
		requestQueue.set(sid, askContext);
		thisContext.send(payload);
		return awaitingResult;
	}
	callback(response, headers) {
		this.accept({
			response,
			headers,
		});
	}
	completedChunks = [];
	/* `incompleteChunks = [];` is initializing an empty array called `incompleteChunks` as a property of
	the `Ask` class. This property is likely used to store any incomplete chunks of data received from
	the server during the request process. */
	incompleteChunks = [];
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
}
export async function request(payload, sendAsIs) {
	const thisContext = this;
	info(`Requested ${payload}`);
	const ask = await (construct(Ask, [payload, thisContext]));
	return ask;
}
// 			packetIdGenerator.free(sid);
