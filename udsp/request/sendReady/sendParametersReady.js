import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
export async function checkSendParametersReady() {
	const { isAsk } = this;
	console.log(`CHECK SETUP STATUS checkSendParametersReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendParametersReady) {
			console.log('NEED TO RESEND sendParametersReady');
			return this.sendParametersReady();
		}
	} else if (this.state === replyRPC.sendParametersReady) {
		console.log('NEED TO RESEND sendParametersReady');
		return this.sendParametersReady();
	}
	this.clearSendParametersReadyTimeout();
}
export function clearSendParametersReadyTimeout() {
	clearTimeout(this.sendParametersReadyTimeout);
	this.sendParametersReadyTimeout = null;
}
export async function sendParametersReady() {
	const { isAsk } = this;
	const source = this;
	if (isAsk) {
		this.setState(askRPC.sendParametersReady);
	} else {
		this.setState(replyRPC.sendParametersReady);
	}
	if (this.totalIncomingParametersSize === 0) {
		return this.sendHeadReady();
	}
	this.sendParametersReadyTimeout = setTimeout(() => {
		source.checkSendParametersReady();
	}, this.latencyTimeout);
	const message = this.getPacketTemplate(3);
	return this.sendPacket(message);
}
