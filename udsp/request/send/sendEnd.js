import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
export async function sendEnd() {
	const { isAsk } = this;
	if (isAsk) {
		this.setState(askRPC.sendEnd);
	} else {
		this.setState(replyRPC.sendEnd);
	}
	const message = this.getPacketTemplate(9);
	return this.sendPacket(message);
}
