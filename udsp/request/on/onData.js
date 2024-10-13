export async function onData(message) {
	console.log('On Data event');
	if (this.events.data) {
		this.events.data(message.data, message.packetId);
	}
}
