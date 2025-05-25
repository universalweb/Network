import { askRPC, replyRPC } from './rpcCodes.js';
export async function onEnd(id, rpc, packetId, data, frame, source, rinfo) {
	this.logInfo('End Packet Received');
	const { isAsk } = source;
	source.end();
}
