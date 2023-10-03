import { hasValue, isArray, isFalse } from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#server/processEvent';
export async function onPacket(packet) {
	const source = this;
	const { isAsk } = this;
	this.lastActive = Date.now();
	const { message } = packet;
	if (!message) {
		return this.destroy('No Message in Packet');
	}
	console.log('On Packet event', message);
	// console.log(packet);
	const {
		// URL or Path Endpoint for API or dynamic path related usage
		path,
		pathReady,
		// Path parameters
		params,
		parametersReady,
		// header payload
		head,
		frame,
		// main data payload
		data,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err,
		end,
		setup,
		headReady,
		dataReady,
		id,
		packetId,
		offset
	} = message;
	console.log(`onPacket Stream Id ${id}`);
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
		if (path && !this.incomingPathPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingPathPackets[packetId] = message;
			this.incomingPath[packetId] = message.path;
			this.totalReceivedUniquePathPackets++;
			this.currentIncomingPathSize += path.length;
			if (this.missingPathPackets.has(packetId)) {
				this.missingPathPackets.delete(packetId);
			}
			if (this.onPath) {
				await this.onPath(message);
			}
			console.log(this, this.currentIncomingPathSize);
			if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
				this.assemblePath();
			}
		}
		if (params && !this.incomingParametersPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingParametersPackets[packetId] = message;
			this.incomingParameters[packetId] = message.params;
			this.totalReceivedUniqueParametersPackets++;
			this.currentIncomingParametersSize += params.length;
			if (this.missingParametersPackets.has(packetId)) {
				this.missingParametersPackets.delete(packetId);
			}
			if (this.onParameters) {
				await this.onParameters(message);
			}
			console.log(this, this.currentIncomingParametersSize);
			if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
				this.assembleParameters();
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
			console.log(`DATA PROGRESS current:${this.currentIncomingDataSize}`, this.totalIncomingDataSize);
			if (this.currentIncomingDataSize === this.totalIncomingDataSize) {
				console.log(this);
				console.log('Last packet received', this.currentIncomingDataSize, this.totalIncomingDataSize);
				message.last = true;
				this.totalIncomingUniqueDataPackets = packetId;
				this.checkData();
			}
		}
	} else if (setup) {
		if (!this.receivedSetupPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedSetupPacket = true;
			let method;
			let totalIncomingHeadSize;
			let totalIncomingDataSize;
			let totalIncomingPathSize;
			let totalIncomingParametersSize;
			if (isAsk) {
				[totalIncomingHeadSize, totalIncomingDataSize] = setup;
			} else {
				[method, totalIncomingPathSize, totalIncomingParametersSize, totalIncomingHeadSize, totalIncomingDataSize] = setup;
				if (!hasValue(method)) {
					method = 'GET';
				}
				this.method = method;
			}
			console.log(`Setup Packet Received HEADER:${totalIncomingHeadSize} DATA:${totalIncomingDataSize}`);
			if (hasValue(totalIncomingPathSize)) {
				this.totalIncomingPathSize = totalIncomingPathSize;
			}
			if (hasValue(totalIncomingParametersSize)) {
				this.totalIncomingParametersSize = totalIncomingParametersSize;
			}
			if (hasValue(totalIncomingHeadSize)) {
				this.totalIncomingHeadSize = totalIncomingHeadSize;
			}
			if (totalIncomingDataSize) {
				this.totalIncomingDataSize = totalIncomingDataSize;
			}
		}
		if (isAsk) {
			this.sendHeadReady();
		} else {
			this.sendPathReady();
		}
	} else if (dataReady) {
		if (this.receivedDataReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedDataReadyPacket = true;
		}
		console.log('Data Ready Packet Received', this.type);
		this.sendData();
	} else if (headReady) {
		if (this.receivedHeadReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedHeadReadyPacket = true;
		}
		console.log('Head Ready Packet Received', this.type);
		this.sendHead();
	} else if (pathReady) {
		if (this.receivedPathReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedPathReadyPacket = true;
		}
		console.log('Path Ready Packet Received', this.type);
		this.sendPath();
	} else if (parametersReady) {
		if (this.receivedParametersReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedParametersReadyPacket = true;
		}
		console.log('Parameters Ready Packet Received', this.type);
		this.sendParameters();
	} else if (end) {
		console.log('End Packet Received');
		// this.check(); && this.cleanup();
	} else if (err) {
		return this.destroy(err);
	}
}
