import { askRPC, replyRPC } from './rpcCodes.js';
export async function onDataReady(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedDataReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedDataReadyPacket = true;
		const { isAsk } = source;
		if (isAsk) {
			source.setState(askRPC.dataReady);
		} else {
			source.setState(replyRPC.dataReady);
		}
	}
	source.logInfo('Data Ready Packet Received', id, rpc, packetId, data, frame, source, rinfo);
	source.sendData();
}
export async function onData(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedSetupPacket || source.incomingDataPackets[packetId]) {
		return;
	}
	source.clearSendDataReadyTimeout();
	source.logInfo('data frame', data);
	const dataLength = data.length;
	source.totalReceivedUniquePackets++;
	source.incomingDataPackets[packetId] = frame;
	source.incomingData[packetId] = data;
	source.totalReceivedUniqueDataPackets++;
	source.currentIncomingDataSize += dataLength;
	if (source.readyState === 2) {
		source.readyState = 3;
	}
	if (source.missingDataPackets.has(packetId)) {
		source.missingDataPackets.delete(packetId);
	}
	if (source.currentIncomingDataSize === source.totalIncomingDataSize) {
		source.logInfo('Last packet received', source.currentIncomingDataSize, source.totalIncomingDataSize);
		frame.last = true;
	}
	await source.onDataProgress();
	await source.onData(frame);
	await source.onDataSync(frame);
	if (frame.last) {
		return source.processData();
	}
}
