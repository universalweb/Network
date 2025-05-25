export async function sendData() {
	const thisReply = this;
	this.logInfo('sendData outgoingDataPackets', this.outgoingDataPackets);
	this.sendPackets(this.outgoingDataPackets);
}
