/**
 * 0 Intro Packet.
 * 1 Setup Packet.
 * 2 Path Ready Packet.
 * 3 Parameters Ready Packet.
 * 4 Head Ready Packet.
 * 5 Data Ready Packet.
 * 6 Path Packet.
 * 7 Parameters Packet.
 * 8 Head Packet.
 * 9 Data Packet.
 * 10 End Packet.
 * 11 Error Packet.
*/
import {
	hasValue, isArray, isFalse, isNumber,
} from '@universalweb/acid';
import { destroy } from './destory.js';
import { processEvent } from '#server/processEvent';
async function onSetup(id, rpc, packetId, data, frame, source) {
	if (source.receivedSetupPacket) {
		return;
	}
	const { isAsk } = source;
	source.totalReceivedUniquePackets++;
	source.receivedSetupPacket = true;
	let method;
	let totalIncomingHeadSize;
	let totalIncomingDataSize;
	let totalIncomingPathSize;
	let totalIncomingParametersSize;
	if (isAsk) {
		[, , totalIncomingHeadSize, totalIncomingDataSize] = frame;
	} else {
		[, , method = 'GET', totalIncomingPathSize, totalIncomingParametersSize, totalIncomingHeadSize, totalIncomingDataSize] = frame;
		source.method = method;
	}
	console.log(`Setup Packet Received HEADER:${totalIncomingHeadSize} DATA:${totalIncomingDataSize}`);
	if (hasValue(totalIncomingPathSize) && isNumber(totalIncomingPathSize)) {
		source.totalIncomingPathSize = totalIncomingPathSize;
	}
	if (hasValue(totalIncomingParametersSize) && isNumber(totalIncomingParametersSize)) {
		source.totalIncomingParametersSize = totalIncomingParametersSize;
	}
	if (hasValue(totalIncomingHeadSize) && isNumber(totalIncomingHeadSize)) {
		source.totalIncomingHeadSize = totalIncomingHeadSize;
	}
	if (hasValue(totalIncomingDataSize) && isNumber(totalIncomingDataSize)) {
		source.totalIncomingDataSize = totalIncomingDataSize;
	}
	if (isAsk) {
		source.sendHeadReady();
	} else {
		source.sendPathReady();
	}
}
async function onPathReady(id, rpc, packetId, data, frame, source) {
	if (!source.receivedPathReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedPathReadyPacket = true;
	}
	console.log('Path Ready Packet Received', source.type);
	source.sendPath();
}
async function onParametersReady(id, rpc, packetId, data, frame, source) {
	if (!source.receivedParametersReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedParametersReadyPacket = true;
	}
	console.log('Parameters Ready Packet Received', source.type);
	source.sendParameters();
}
async function onHeadReady(id, rpc, packetId, data, frame, source) {
	if (!source.receivedHeadReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedHeadReadyPacket = true;
	}
	source.sendHead();
}
async function onDataReady(id, rpc, packetId, data, frame, source) {
	if (!source.receivedDataReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedDataReadyPacket = true;
	}
	console.log('Data Ready Packet Received', source.type);
	source.sendData();
}
async function onPath(id, rpc, packetId, data, frame, source) {
	if (!source.receivedSetupPacket || source.incomingPathPackets[packetId]) {
		return;
	}
	source.totalReceivedUniquePackets++;
	source.incomingPathPackets[packetId] = frame;
	source.incomingPath[packetId] = data;
	source.totalReceivedUniquePathPackets++;
	source.currentIncomingPathSize += data.length;
	if (source.missingPathPackets.has(packetId)) {
		source.missingPathPackets.delete(packetId);
	}
	source.onPathProgress();
	if (source.onPath) {
		await source.onPath(frame);
	}
	console.log(source, source.currentIncomingPathSize);
	if (source.totalIncomingPathSize === source.currentIncomingPathSize) {
		source.processPath();
	}
}
async function onParameters(id, rpc, packetId, data, frame, source) {
	if (!source.receivedSetupPacket || source.incomingParametersPackets[packetId]) {
		return;
	}
	source.totalReceivedUniquePackets++;
	source.incomingParametersPackets[packetId] = frame;
	source.incomingParameters[packetId] = data;
	source.totalReceivedUniqueParametersPackets++;
	source.currentIncomingParametersSize += data.length;
	if (source.missingParametersPackets.has(packetId)) {
		source.missingParametersPackets.delete(packetId);
	}
	source.onParametersProgress();
	await source.onParameters(frame);
	if (source.totalIncomingParametersSize === source.currentIncomingParametersSize) {
		source.processParameters();
	}
}
async function onHead(id, rpc, packetId, data, frame, source) {
	if (!source.receivedSetupPacket || source.incomingHeadPackets[packetId]) {
		return;
	}
	source.totalReceivedUniquePackets++;
	source.incomingHeadPackets[packetId] = frame;
	source.incomingHead[packetId] = data;
	source.totalReceivedUniqueHeadPackets++;
	source.currentIncomingHeadSize += data.length;
	if (source.missingHeadPackets.has(packetId)) {
		source.missingH1eadPackets.delete(packetId);
	}
	source.onHeadProgress();
	if (source.onHead) {
		await source.onHead(frame);
	}
	console.log(source, source.currentIncomingHeadSize);
	if (source.totalIncomingHeadSize === source.currentIncomingHeadSize) {
		source.processHead();
	}
}
async function onData(id, rpc, packetId, data, frame, source) {
	if (!source.receivedSetupPacket || source.incomingDataPackets[packetId]) {
		return;
	}
	console.log('data frame', data);
	source.totalReceivedUniquePackets++;
	source.incomingDataPackets[packetId] = frame;
	source.incomingData[packetId] = data;
	source.totalReceivedUniqueDataPackets++;
	const dataLength = data.length;
	source.currentIncomingDataSize += dataLength;
	if (source.readyState === 2) {
		source.readyState = 3;
	}
	if (source.missingDataPackets.has(packetId)) {
		source.missingDataPackets.delete(packetId);
	}
	if (source.currentIncomingDataSize === source.totalIncomingDataSize) {
		console.log('Last packet received', source.currentIncomingDataSize, source.totalIncomingDataSize);
		frame.last = true;
	}
	source.onDataProgress();
	source.onData(frame);
	source.onDataSync(frame);
	if (frame.last) {
		source.processData();
	}
}
async function onEnd(id, rpc, packetId, data, frame, source) {
	console.log('End Packet Received');
	source.end();
}
async function onError(id, rpc, packetId, data, frame, source) {
	source.destroy(data);
	return;
}
const rpcFunctions = [() => {}, onSetup, onPathReady, onParametersReady, onHeadReady, onDataReady,
	onPath, onParameters, onHead, onData, onEnd, onError];
export async function onFrame(frame, header) {
	const source = this;
	const { isAsk } = source;
	source.lastActive = Date.now();
	if (!frame) {
		console.log(frame);
		return source.destroy('No Frame in Frame -> Packet');
	}
	console.log('On Packet event frame:', frame);
	const [
		id,
		rpc,
		packetId,
		data
	] = frame;
	console.log(`onPacket Stream Id ${id}`);
	source.totalReceivedPackets++;
	if (!isNumber(rpc)) {
		return source.destroy('Invalid RPC Not a Number');
	}
	if (rpc < 0 || rpc > 11) {
		return source.destroy('Invalid RPC Not a valid RPC Number');
	}
	const rpcFunction = rpcFunctions[Number(rpc)];
	if (!rpcFunction) {
		return source.destroy('Invalid RPC Not a Function');
	}
	rpcFunction(id, rpc, packetId, data, frame, source);
}
