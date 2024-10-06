import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
export async function checkSendPathReady() {
	const { isAsk } = this;
	console.log(`CHECK SETUP STATUS checkSendPathReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendPathReady) {
			console.log('NEED TO RESEND sendPathReady');
			return this.sendPathReady();
		}
	} else if (this.state === replyRPC.sendPathReady) {
		console.log('NEED TO RESEND sendPathReady');
		return this.sendPathReady();
	}
	this.clearSendPathReadyTimeout();
}
export function clearSendPathReadyTimeout() {
	if (this.sendPathReadyTimeout !== null) {
		console.log('CLEAR sendPathReady TIMEOUT');
		clearTimeout(this.sendPathReadyTimeout);
		this.sendPathReadyTimeout = null;
	}
}
export async function sendPathReady() {
	const { isAsk } = this;
	const source = this;
	if (isAsk) {
		this.setState(askRPC.sendPathReady);
	} else {
		this.setState(replyRPC.sendPathReady);
	}
	this.sendPathReadyTimeout = setTimeout(() => {
		source.checkSendPathReady();
	}, this.latencyTimeout);
	const message = this.getPacketTemplate(1);
	return this.sendPacket(message);
}
