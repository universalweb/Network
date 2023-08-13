import { hasValue, isFalse } from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#udsp/processEvent';
export async function onPacket(packet) {
	const source = this;
	this.lastActive = Date.now();
	const { message } = packet;
	if (!message) {
		return this.destroy('No Message in Packet');
	}
	console.log('On Packet event', message);
	// console.log(packet);
	const {
		// main data payload
		data,
		// header payload
		head,
		frame,
		// Packet total
		hpt: totalIncomingUniqueHeadPackets,
		dpt: totalIncomingUniqueDataPackets,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err,
		end,
		setup,
		headReady,
		dataReady,
	} = message;
	let streamId;
	let packetId;
	let offset;
	if (frame) {
		[streamId, packetId, offset] = frame;
	}
	console.log(`onPacket Stream Id ${streamId}`);
	this.totalReceivedPackets++;
	if (hasValue(packetId)) {
		if (!this.receivedSetupPacket) {
			return this.destroy('Setup packet not received');
		}
		source.lastActive = Date.now();
		if (head && !this.incomingHeadPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingHeadPackets[packetId] = message;
			this.incomingHead[packetId] = message.head;
			this.totalReceivedUniqueHeadPackets++;
			this.currentIncomingHeadSize += head.length;
			if (this.missingHeadPackets.has(packetId)) {
				this.missingHeadPackets.delete(packetId);
			}
			if (this.onHead) {
				await this.onHead(message);
			}
			console.log(this, this.currentIncomingHeadSize);
			if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
				this.assembleHead();
			}
		}
		if (data && !this.incomingDataPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingDataPackets[packetId] = message;
			this.incomingData[packetId] = message.data;
			this.totalReceivedUniqueDataPackets++;
			const dataLength = data.length;
			this.currentIncomingDataSize += dataLength;
			if (this.readyState === 2) {
				this.readyState = 3;
			}
			if (this.missingDataPackets.has(packetId)) {
				this.missingDataPackets.delete(packetId);
			}
			if (this.onData) {
				await this.onData(message);
			}
			if (dataLength + offset === this.totalIncomingDataSize) {
				console.log('Last packet received');
				message.last = true;
			}
			if (this.currentIncomingDataSize === this.totalIncomingDataSize) {
				// console.log(this);
				this.totalIncomingUniqueDataPackets = packetId;
				this.checkData();
			}
		}
	} else if (setup) {
		this.receivedSetupPacket = true;
		const [method, pathSize, paramSize, headerSize, dataSize] = setup;
		console.log('Setup Packet Received', headerSize);
		this.incomingSetupPacket = message;
		if (hasValue(pathSize)) {
			this.pathSize = pathSize;
		}
		if (hasValue(paramSize)) {
			this.paramSize = paramSize;
		}
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
		console.log('Head Ready Packet Received', this.type);
		if (hasValue(totalIncomingUniqueDataPackets)) {
			this.totalIncomingUniqueDataPackets = totalIncomingUniqueDataPackets;
		}
		this.sendHead();
	} else if (dataReady) {
		this.receivedDataReadyPacket = true;
		console.log('Data Ready Packet Received', this.type);
		this.sendData();
	} else if (end) {
		console.log('End Packet Received');
		// this.check(); && this.cleanup();
	} else if (err) {
		return this.destroy(err);
	}
}
