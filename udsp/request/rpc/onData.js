export async function onDataReady(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedDataReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedDataReadyPacket = true;
	}
	console.log('Data Ready Packet Received', id, rpc, packetId, data, frame, source, rinfo);
	source.sendData();
}
export async function onData(id, rpc, packetId, data, frame, source, rinfo) {
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
