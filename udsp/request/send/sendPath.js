export async function sendPath() {
	const thisReply = this;
	this.logInfo('sendPath outgoingPathPackets', this.outgoingPathPackets);
	this.sendPackets(this.outgoingPathPackets);
}
