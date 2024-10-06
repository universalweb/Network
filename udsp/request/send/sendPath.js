export async function sendPath() {
	const thisReply = this;
	console.log('sendPath outgoingPathPackets', this.outgoingPathPackets);
	this.sendPackets(this.outgoingPathPackets);
}
