export async function onHead(message) {
	this.logInfo('On Head event');
	if (this.events.head) {
		this.events.head(message.head, message.packetId);
	}
}
