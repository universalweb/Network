import { askRPC, replyRPC } from './rpcCodes.js';
export async function onParametersReady(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedParametersReadyPacket) {
		source.totalReceivedUniquePackets++;
		source.receivedParametersReadyPacket = true;
		const { isAsk } = source;
		if (isAsk) {
			source.setState(askRPC.parametersReady);
		} else {
			source.setState(replyRPC.parametersReady);
		}
	}
	source.logInfo('Parameters Ready Packet Received', source.type);
	source.sendParameters();
}
export async function onParameters(id, rpc, packetId, data, frame, source, rinfo) {
	if (!source.receivedSetupPacket || source.incomingParametersPackets[packetId]) {
		return;
	}
	source.clearSendParametersReadyTimeout();
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
