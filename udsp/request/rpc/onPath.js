export async function onPathReady(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedPathReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedPathReadyPacket = true;
	}
	console.log('Path Ready Packet Received', source.type);
	source.sendPath();
}
export async function onPath(id, rpc, packetId, data, frame, source, rinfo) {
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
