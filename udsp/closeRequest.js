// packetIdGenerator.free(sid);
export function closeRequest(askObject, requestQueue) {
	if (askObject.state === 2) {
		requestQueue.delete(askObject.sid);
	}
}
