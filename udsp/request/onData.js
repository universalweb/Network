export async function onData(message) {
	console.log('On Data event');
	const {
		pid,
		data
	} = message;
	this.data[pid] = data;
	this.currentPayloadSize += data.length;
	if (this.totalIncomingPayloadSize) {
		if (this.currentPayloadSize > 0) {
			this.progress = (this.currentPayloadSize / this.totalIncomingPayloadSize) * 100;
		}
		console.log('Progress', this.progress);
	}
	if (this.events.data) {
		this.events.data(data, pid);
	}
}
