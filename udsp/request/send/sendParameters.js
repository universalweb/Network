export async function sendParameters() {
	const thisReply = this;
	console.log('sendParameters outgoingParametersPackets', this.outgoingParametersPackets);
	this.sendPackets(this.outgoingParametersPackets);
}
