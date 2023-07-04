import { hasValue } from '@universalweb/acid';
import { destroy } from './destory.js';
export async function onPacket(packet) {
	const source = this;
	this.lastPacketTime = Date.now();
	const { message } = packet;
	const {
		data,
		head,
		// Stream ID
		sid: streamId,
		// Packet ID
		pid: packetId,
		// Action
		method,
		// Packet total
		pt: totalIncomingUniquePackets,
		headerSize,
		// Data payload size
		dataSize,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err,
		end,
		setup
	} = message;
	console.log(`Stream Id ${streamId}`);
	if (hasValue(totalIncomingUniquePackets)) {
		this.totalIncomingUniquePackets = totalIncomingUniquePackets;
	}
	if (hasValue(dataSize)) {
		this.totalIncomingDataSize = dataSize;
	}
	if (hasValue(headerSize)) {
		this.totalIncomingHeadSize = headerSize;
	}
	this.totalIncomingPackets++;
	if (hasValue(packetId)) {
		if (head && !this.incomingHeadPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingHeadPackets[packetId] = message;
			this.totalReceivedUniqueHeadPackets++;
			this.currentIncomingHeadSize += head.length;
			if (this.onHead) {
				await this.onHead(message);
			}
		}
		if (data && !this.incomingDataPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingDataPackets[packetId] = message;
			this.totalReceivedUniqueDataPackets++;
			this.currentIncomingDataSize += data.length;
			if (this.onData) {
				await this.onData(message);
			}
		}
	}
	if (end) {
		if (data) {
			this.totalIncomingUniqueDataPackets = packetId;
		}
		if (head) {
			this.totalIncomingUniqueHeadPackets = packetId;
		}
		if (this.totalIncomingUniqueHeadPackets === this.totalReceivedUniqueHeadPackets) {
			this.assembleHead();
		}
		if (this.totalIncomingUniqueDataPackets === this.totalReceivedUniqueDataPackets) {
			this.assembleData();
		}
	}
	if (err) {
		return this.destroy(err);
	}
	if (setup) {
		console.log('Setup Packet Received');
		this.send(this.setupConfirmationPacket);
	}
	console.log('On Packet event', this);
}
