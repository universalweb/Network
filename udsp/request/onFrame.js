import {
	hasValue, isArray, isFalse, isNumber,
} from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#server/processEvent';
export async function onFrame(packet) {
	const source = this;
	const { isAsk } = this;
	this.lastActive = Date.now();
	const { message } = packet;
	if (!message) {
		return this.destroy('No Message i:n Packet');
	}
	console.log('On Packet event', message);
	console.log(packet);
	const {
		id,
		rpc,
		data
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
			this.onHeadProgress();
			if (this.onHead) {
				await this.onHead(message);
			}
			console.log(this, this.currentIncomingHeadSize);
			if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
				this.processHead();
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
			this.onPathProgress();
			if (this.onPath) {
				await this.onPath(message);
			}
			console.log(this, this.currentIncomingPathSize);
			if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
				this.processPath();
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
			this.onParametersProgress();
			await this.onParameters(message);
			if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
				this.processParameters();
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
			if (this.currentIncomingDataSize === this.totalIncomingDataSize) {
				console.log('Last packet received', this.currentIncomingDataSize, this.totalIncomingDataSize);
				message.last = true;
			}
			this.onDataProgress();
			this.onData(message);
			this.onDataSync(message);
			if (message.last) {
				this.processData();
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
			if (hasValue(totalIncomingPathSize) && isNumber(totalIncomingPathSize)) {
				this.totalIncomingPathSize = totalIncomingPathSize;
			}
			if (hasValue(totalIncomingParametersSize) && isNumber(totalIncomingParametersSize)) {
				this.totalIncomingParametersSize = totalIncomingParametersSize;
			}
			if (hasValue(totalIncomingHeadSize) && isNumber(totalIncomingHeadSize)) {
				this.totalIncomingHeadSize = totalIncomingHeadSize;
			}
			if (hasValue(totalIncomingDataSize) && isNumber(totalIncomingDataSize)) {
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
