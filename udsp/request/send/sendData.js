export async function sendData() {
	const thisReply = this;
	console.log('sendData outgoingDataPackets', this.outgoingDataPackets);
	this.sendPackets(this.outgoingDataPackets);
}
