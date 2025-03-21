export async function sendParameters() {
	const thisReply = this;
	this.logInfo('sendParameters outgoingParametersPackets', this.outgoingParametersPackets);
	this.sendPackets(this.outgoingParametersPackets);
}
