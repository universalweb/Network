import { promise } from 'Acid';
export class Ask {
	constructor(payload, thisClient) {
		const thisAsk = this;
		const timeStamp = Date.now();
		const {
			requestQueue,
			packetIdGenerator
		} = thisClient;
		// sid is a Stream ID
		const sid = packetIdGenerator.get();
		payload.sid = sid;
		payload.t = timeStamp;
		thisAsk.payload = payload;
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		requestQueue.set(sid, thisAsk);
		thisClient.send(payload);
		return awaitingResult;
	}
	/* `completedChunks = [];` is initializing an empty array called `completedChunks` as a property of
	the `Ask` class. This property is likely used to store any completed chunks of data received from
	the server during the request process. */
	completedChunks = [];
	/* `incompleteChunks = [];` is initializing an empty array called `incompleteChunks` as a property of
	the `Ask` class. This property is likely used to store any incomplete chunks of data received from
	the server during the request process. */
	incompleteChunks = [];
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
	recieve() {
	}
	callback(response, headers) {
		this.accept({
			response,
			headers,
		});
	}
}
