import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
import { hasValue } from '@universalweb/utilitylib';
export async function checkSendHeadReady() {
	const { isAsk } = this;
	this.logInfo(`CHECK SETUP STATUS checkSendHeadReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendHeadReady) {
			this.logInfo('NEED TO RESEND sendHeadReady');
			return this.sendHeadReady();
		}
	} else if (this.state === replyRPC.sendHeadReady) {
		this.logInfo('NEED TO RESEND sendHeadReady');
		return this.sendHeadReady();
	}
	this.clearSendHeadReadyTimeout();
}
export function clearSendHeadReadyTimeout() {
	if (hasValue(this.sendHeadReadyTimeout)) {
		clearTimeout(this.sendHeadReadyTimeout);
		this.sendHeadReadyTimeout = null;
	}
}
export async function sendHeadReady() {
	const { isAsk } = this;
	const source = this;
	if (isAsk) {
		this.setState(askRPC.sendHeadReady);
	} else {
		this.setState(replyRPC.sendHeadReady);
	}
	if (this.totalIncomingHeadSize === 0) {
		return this.sendDataReady();
	}
	this.sendHeadReadyTimeout = setTimeout(() => {
		source.checkSendHeadReady();
	}, this.latencyTimeout);
	const message = this.getPacketTemplate(5);
	return this.sendPacket(message);
}
