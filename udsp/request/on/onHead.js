export async function onHead(message) {
	this.logInfo('On Head event');
	if (this.hasEvent('head')) {
		this.emitEvent('head', message.head, message.packetId);
	}
}
