import { askRPC, replyRPC } from './rpcCodes.js';
export async function onEnd(id, rpc, packetId, data, frame, source, rinfo) {
	console.log('End Packet Received');
	const { isAsk } = source;
	source.end();
}
