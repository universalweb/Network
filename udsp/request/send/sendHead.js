export async function sendHead() {
	const thisReply = this;
	console.log('sendHead outgoingHeadPackets', this.outgoingHeadPackets);
	this.sendPackets(this.outgoingHeadPackets);
}
