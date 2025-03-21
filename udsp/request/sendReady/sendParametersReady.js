import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
import { hasValue } from '@universalweb/acid';
export async function checkSendParametersReady() {
	const { isAsk } = this;
	this.logInfo(`CHECK SETUP STATUS checkSendParametersReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendParametersReady) {
			this.logInfo('NEED TO RESEND sendParametersReady');
			return this.sendParametersReady();
		}
	} else if (this.state === replyRPC.sendParametersReady) {
		this.logInfo('NEED TO RESEND sendParametersReady');
		return this.sendParametersReady();
	}
	this.clearSendParametersReadyTimeout();
}
export function clearSendParametersReadyTimeout() {
	if (hasValue(this.sendParametersReadyTimeout)) {
		clearTimeout(this.sendParametersReadyTimeout);
		this.sendParametersReadyTimeout = null;
	}
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
