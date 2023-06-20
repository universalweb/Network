// packetIdGenerator.free(sid);
export function closeRequest(askObject, queue) {
	if (askObject.state === 2) {
		queue.delete(askObject.sid);
	}
}
