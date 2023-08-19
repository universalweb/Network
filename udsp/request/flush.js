import { clear, clearBuffer } from '@universalweb/acid';
export function flushOutgoing() {
	clear(this.outgoingAck);
	clear(this.outgoingNacks);
	clear(this.outgoingHeadPackets);
	clear(this.outgoingDataPackets);
	clear(this.outgoingPathPackets);
	this.response = null;
	this.totalSentConfirmedPackets = null;
	this.totalOutgoingPayloadSize = null;
}
export function flushIncoming() {
	clear(this.incomingAks);
	clear(this.incomingNacks);
	clear(this.incomingDataPackets);
	this.request = null;
	this.incomingSetupPacket = null;
	this.currentIncomingHeadSize = null;
	this.currentIncomingDataSize = null;
	this.totalReceivedUniquePackets = null;
	this.totalIncomingHeadSize = null;
	this.totalReceivedPackets = null;
	this.incomingSetupPacket = null;
	this.totalReceivedUniquePathPackets = null;
	this.totalReceivedUniqueParametersPackets = null;
	this.totalReceivedUniqueHeadPackets = null;
	this.totalReceivedUniqueDataPackets = null;
}
// Flush all data
export function flush() {
	clear(this.missingHeadPackets);
	clear(this.missingDataPackets);
	this.lastActive = null;
	this.created = null;
	this.headAssembled = null;
	this.flushOutgoing();
	this.flushIncoming();
}
