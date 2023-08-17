import { clear, clearBuffer } from '@universalweb/acid';
export function flushOutgoing() {
	if (this.outgoingHead) {
		clearBuffer(this.outgoingHead);
	}
	if (this.outgoingData) {
		clearBuffer(this.outgoingData);
	}
	clear(this.outgoingAck);
	clear(this.outgoingNacks);
	clear(this.outgoingHeadPackets);
	clear(this.outgoingDataPackets);
	this.response = null;
	this.totalSentConfirmedPackets = null;
	this.totalOutgoingPayloadSize = null;
}
export function flushIncoming() {
	if (this.incomingHead) {
		clearBuffer(this.outgoingHead);
	}
	if (this.incomingData) {
		clearBuffer(this.outgoingData);
	}
	clear(this.incomingAks);
	clear(this.incomingNacks);
	clear(this.outgoingNacks);
	clear(this.incomingHead);
	clear(this.incomingDataPackets);
	this.request = null;
	this.incomingSetupPacket = null;
	this.currentIncomingHeadSize = null;
	this.currentIncomingDataSize = null;
	this.totalReceivedUniquePackets = null;
	this.totalIncomingHeadSize = null;
	this.totalReceivedPackets = null;
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
