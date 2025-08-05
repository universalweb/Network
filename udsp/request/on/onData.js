export async function onData(message) {
	this.logInfo('On Data event');
	if (this.hasEvent('data')) {
		this.emitEvent('data', message.data, message.packetId);
	}
}
