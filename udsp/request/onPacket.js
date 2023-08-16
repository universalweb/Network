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
		if (params && !this.incomingParamsPackets[packetId]) {
			this.totalReceivedUniquePackets++;
			this.incomingParamsPackets[packetId] = message;
			this.incomingParams[packetId] = message.params;
			this.totalReceivedUniqueParamsPackets++;
			this.currentIncomingParamsSize += params.length;
			if (this.missingParamsPackets.has(packetId)) {
				this.missingParamsPackets.delete(packetId);
			}
			if (this.onParams) {
				await this.onParams(message);
			}
			console.log(this, this.currentIncomingParamsSize);
			if (this.totalIncomingParamsSize === this.currentIncomingParamsSize) {
				this.assembleParams();
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
		const [method, pathSize, parametersSize, headerSize, dataSize] = setup;
		console.log('Setup Packet Received', headerSize);
		this.incomingSetupPacket = message;
		if (hasValue(pathSize)) {
			this.pathSize = pathSize;
		}
		if (hasValue(parametersSize)) {
			this.parametersSize = parametersSize;
		}
		if (hasValue(headerSize)) {
			this.totalIncomingHeadSize = headerSize;
		}
		if (hasValue(method)) {
			this.method = method;
		}
		if (hasValue(totalIncomingUniqueHeadPackets)) {
			this.totalIncomingUniqueHeadPackets = totalIncomingUniqueHeadPackets;
		}
		this.sendPathReady();
	} else if (dataReady) {
		this.receivedDataReadyPacket = true;
		console.log('Data Ready Packet Received', this.type);
		this.sendData();
	} else if (headReady) {
		this.receivedHeadReadyPacket = true;
		console.log('Head Ready Packet Received', this.type);
		if (hasValue(totalIncomingUniqueDataPackets)) {
			this.totalIncomingUniqueDataPackets = totalIncomingUniqueDataPackets;
		}
		this.sendHead();
	} else if (pathReady) {
		this.receivedPathReadyPacket = true;
		console.log('Path Ready Packet Received', this.type);
		this.sendPath();
	} else if (parametersReady) {
		this.receivedParametersReadyPacket = true;
		console.log('Parameters Ready Packet Received', this.type);
		this.sendParameters();
	} else if (end) {
		console.log('End Packet Received');
		// this.check(); && this.cleanup();
	} else if (err) {
		return this.destroy(err);
	}
}
