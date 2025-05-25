import { askRPC, replyRPC } from './rpcCodes.js';
export async function onHeadReady(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedHeadReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedHeadReadyPacket = true;
		const { isAsk } = source;
		if (isAsk) {
			source.setState(askRPC.headReady);
		} else {
			source.setState(replyRPC.headReady);
		}
	}
	source.sendHead();
}
export async function onHead(id, rpc, packetId, data, frame, source, rinfo) {
	this.logInfo('On Head Function', id, rpc, packetId, data, frame, source, rinfo);
	if (!source.receivedSetupPacket || source.incomingHeadPackets[packetId]) {
		return;
	}
	source.clearSendHeadReadyTimeout();
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
	this.logInfo(source, source.currentIncomingHeadSize);
	if (source.totalIncomingHeadSize === source.currentIncomingHeadSize) {
		source.processHead();
	}
}
