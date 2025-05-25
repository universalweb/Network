export async function onData(message) {
	this.logInfo('On Data event');
	if (this.events.data) {
		this.events.data(message.data, message.packetId);
	}
}
