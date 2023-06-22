export async function onData(message) {
	console.log('On Data event');
	const {
		pid,
		body
	} = message;
	this.data[pid] = body;
	this.currentPayloadSize += body.length;
	if (this.totalIncomingPayloadSize) {
		this.progress = this.totalIncomingPayloadSize / this.currentPayloadSize;
		console.log('Progress', this.progress);
	}
	if (this.events.data) {
		this.events.data(body, pid);
	}
}
