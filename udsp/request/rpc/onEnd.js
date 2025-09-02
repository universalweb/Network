import { askRPC, replyRPC } from './rpcCodes.js';
export async function onEnd(id, rpc, packetId, data, frame, source, rinfo) {
	source.logInfo('End Packet Received');
	const { isAsk } = source;
	source.end();
}
