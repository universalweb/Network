export async function sendHead() {
	const thisReply = this;
	this.logInfo('sendHead outgoingHeadPackets', this.outgoingHeadPackets);
	this.sendPackets(this.outgoingHeadPackets);
}
