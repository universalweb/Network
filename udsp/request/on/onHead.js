export async function onHead(message) {
	console.log('On Head event');
	if (this.events.head) {
		this.events.head(message.head, message.packetId);
	}
}
