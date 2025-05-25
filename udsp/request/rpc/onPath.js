import { askRPC, replyRPC } from './rpcCodes.js';
export async function onPathReady(id, rpc, packetId, data, frame, source, rinfo) {
	const { isAsk } = source;
	if (!source.receivedPathReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedPathReadyPacket = true;
		if (isAsk) {
			source.setState(askRPC.pathReady);
		} else {
			source.setState(replyRPC.pathReady);
		}
	}
	this.logInfo(`Path Ready Packet Received TYPE:${source.constructor.name} STATE: ${source.state}`);
	source.sendPath();
}
export async function onPath(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedSetupPacket || source.incomingPathPackets[packetId]) {
		return;
	}
	source.clearSendPathReadyTimeout();
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
	this.logInfo(source, source.currentIncomingPathSize);
	if (source.totalIncomingPathSize === source.currentIncomingPathSize) {
		source.processPath();
	}
}
