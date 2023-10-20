import {
	hasValue, isArray, isFalse, isNumber,
} from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#server/processEvent';
export async function onFrame(frame, header) {
	const source = this;
	const { isAsk } = this;
	this.lastActive = Date.now();
	if (!frame) {
		console.log(frame);
		return this.destroy('No Frame in Frame -> Packet');
	}
	console.log('On Packet event frame:', frame);
	const [
		id,
		rpc,
		packetId
	] = frame;
	console.log(`onPacket Stream Id ${id}`);
	this.totalReceivedPackets++;
	if (rpc === 1) {
		if (!this.receivedSetupPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedSetupPacket = true;
			let method;
			let totalIncomingHeadSize;
			let totalIncomingDataSize;
			let totalIncomingPathSize;
			let totalIncomingParametersSize;
			if (isAsk) {
				[, , totalIncomingHeadSize, totalIncomingDataSize] = frame;
			} else {
				[, , method = 'GET', totalIncomingPathSize, totalIncomingParametersSize, totalIncomingHeadSize, totalIncomingDataSize] = frame;
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
		return;
	} else if (rpc === 2) {
		if (this.receivedPathReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedPathReadyPacket = true;
		}
		console.log('Path Ready Packet Received', this.type);
		this.sendPath();
		return;
	} else if (rpc === 3) {
		console.log('Head Ready Packet Received', this.type);
		if (this.receivedParametersReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedParametersReadyPacket = true;
		}
		console.log('Parameters Ready Packet Received', this.type);
		this.sendParameters();
		return;
	} else if (rpc === 4) {
		if (this.receivedHeadReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedHeadReadyPacket = true;
		}
		this.sendHead();
		return;
	} else if (rpc === 5) {
		if (this.receivedDataReadyPacket) {
			this.totalReceivedUniquePackets++;
			this.receivedDataReadyPacket = true;
		}
		console.log('Data Ready Packet Received', this.type);
		this.sendData();
		return;
	} else if (rpc === 10) {
		console.log('End Packet Received');
		// this.check(); && this.cleanup();
	} else if (rpc === 11) {
		const [,,, err] = frame;
		return this.destroy(err);
	}
	if (!this.receivedSetupPacket) {
		console.log(this);
		return this.destroy('Setup packet not received');
	} else if (rpc === 6 && !this.incomingPathPackets[packetId]) {
		const [,,, path] = frame;
		this.totalReceivedUniquePackets++;
		this.incomingPathPackets[packetId] = frame;
		this.incomingPath[packetId] = path;
		this.totalReceivedUniquePathPackets++;
		this.currentIncomingPathSize += path.length;
		if (this.missingPathPackets.has(packetId)) {
			this.missingPathPackets.delete(packetId);
		}
		this.onPathProgress();
		if (this.onPath) {
			await this.onPath(frame);
		}
		console.log(this, this.currentIncomingPathSize);
		if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
			this.processPath();
		}
	} else if (rpc === 7 && !this.incomingParametersPackets[packetId]) {
		const [,,, params] = frame;
		this.totalReceivedUniquePackets++;
		this.incomingParametersPackets[packetId] = frame;
		this.incomingParameters[packetId] = params;
		this.totalReceivedUniqueParametersPackets++;
		this.currentIncomingParametersSize += params.length;
		if (this.missingParametersPackets.has(packetId)) {
			this.missingParametersPackets.delete(packetId);
		}
		this.onParametersProgress();
		await this.onParameters(frame);
		if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
			this.processParameters();
		}
	} else if (rpc === 8 && !this.incomingHeadPackets[packetId]) {
		const [,,, head] = frame;
		this.totalReceivedUniquePackets++;
		this.incomingHeadPackets[packetId] = frame;
		this.incomingHead[packetId] = head;
		this.totalReceivedUniqueHeadPackets++;
		this.currentIncomingHeadSize += head.length;
		if (this.missingHeadPackets.has(packetId)) {
			this.missingH1eadPackets.delete(packetId);
		}
		this.onHeadProgress();
		if (this.onHead) {
			await this.onHead(frame);
		}
		console.log(this, this.currentIncomingHeadSize);
		if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
			this.processHead();
		}
	} else if (rpc === 9 && !this.incomingDataPackets[packetId]) {
		const [,,, data] = frame;
		console.log('data frame', data);
		this.totalReceivedUniquePackets++;
		this.incomingDataPackets[packetId] = frame;
		this.incomingData[packetId] = data;
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
			frame.last = true;
		}
		this.onDataProgress();
		this.onData(frame);
		this.onDataSync(frame);
		if (frame.last) {
			this.processData();
		}
	}
}
