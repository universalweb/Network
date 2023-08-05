import { hasValue } from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#udsp/processEvent';
export async function onPacket(packet) {
	const source = this;
	this.lastPacketTime = Date.now();
	const { message } = packet;
	if (!message) {
		return this.destroy('No Message in Packet');
	}
	// console.log(packet);
	const {
		// main data payload
		data,
		// header payload
		head,
		// Stream ID
		sid: streamId,
		// Packet ID
		pid: packetId,
		// Action
		method,
		// Packet total
		hpt: totalIncomingUniqueHeadPackets,
		dpt: totalIncomingUniqueDataPackets,
		headerSize,
		// Data payload size
		dataSize,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err,
		end,
		setup,
		headReady,
		dataReady,
		last
	} = message;
	console.log(`onPacket Stream Id ${streamId}`);
	this.totalIncomingPackets++;
	if (this.ok) {
		return;
	}
	if (hasValue(packetId)) {
		source.lastActive = Date.now();
		if (head && !this.incomingHeadPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingHeadPackets[packetId] = message.head;
			this.totalReceivedUniqueHeadPackets++;
			this.currentIncomingHeadSize += head.length;
			if (this.missingHeadPackets.has(packetId)) {
				this.missingHeadPackets.delete(packetId);
			}
			if (this.onHead) {
				await this.onHead(message);
			}
			if (this.totalIncomingUniqueHeadPackets === this.totalReceivedUniqueHeadPackets) {
				this.assembleHead();
			}
		}
		if (data && !this.incomingDataPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingDataPackets[packetId] = message.data;
			this.totalReceivedUniqueDataPackets++;
			this.currentIncomingDataSize += data.length;
			if (this.missingDataPackets.has(packetId)) {
				this.missingDataPackets.delete(packetId);
			}
			if (this.onData) {
				await this.onData(message);
			}
			if (last) {
				this.totalIncomingUniqueDataPackets = packetId;
				this.checkData();
			}
		}
	} else if (setup) {
		this.receivedSetupPacket = true;
		console.log('Setup Packet Received');
		if (hasValue(headerSize)) {
			this.totalIncomingHeadSize = headerSize;
		}
		if (method) {
			this.method = method;
		}
		if (hasValue(totalIncomingUniqueHeadPackets)) {
			this.totalIncomingUniqueHeadPackets = totalIncomingUniqueHeadPackets;
		}
		this.sendHeadReady();
	} else if (headReady) {
		this.receivedHeadReadyPacket = true;
		console.log('Head Ready Packet Received');
		if (hasValue(totalIncomingUniqueDataPackets)) {
			this.totalIncomingUniqueDataPackets = totalIncomingUniqueDataPackets;
		}
		this.sendHead();
	} else if (dataReady) {
		this.receivedDataReadyPacket = true;
		console.log('Data Ready Packet Received');
		this.sendData();
	} else if (end) {
		console.log('End Packet Received');
		// this.check(); && this.cleanup();
	} else if (err) {
		return this.destroy(err);
	}
	console.log('On Packet event', this.id);
}
