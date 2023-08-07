export function flushOutgoing() {
	this.outgoingAcks = null;
	this.outgoingNacks = null;
	this.outgoingPayload = null;
	this.outgoingPackets = null;
	this.outgoingChunks = null;
	this.totalSentConfirmedPackets = null;
	this.totalOutgoingPayloadSize = null;
}
export function flushIncoming() {
	this.compiledData = null;
	this.incomingPackets = null;
	this.incomingAks = null;
	this.incomingNacks = null;
	this.totalOutgoingPackets = null;
	this.totalOutgoingPayloadSize = null;
	this.totalReceivedPackets = null;
}
// Flush all data
export function flush() {
	if (this.compiledData) {
		this.compiledData.fill(0);
	}
	if (this.headCompiled) {
		this.headCompiled.fill(0);
	}
	this.flushOutgoing();
	this.flushIncoming();
	this.completed = Date.now();
}
