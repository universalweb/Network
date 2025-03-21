import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
import { hasValue } from '@universalweb/acid';
export async function checkSendDataReady() {
	const { isAsk } = this;
	this.logInfo(`CHECK SETUP STATUS checkSendDataReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendDataReady) {
			this.logInfo('NEED TO RESEND sendDataReady', this.state);
			return this.sendDataReady();
		}
	} else if (this.state === replyRPC.sendDataReady) {
		this.logInfo('NEED TO RESEND sendDataReady', this.state);
		return this.sendDataReady();
	}
	this.clearSendDataReadyTimeout();
}
export function clearSendDataReadyTimeout() {
	if (hasValue(this.sendDataReadyTimeout)) {
		clearTimeout(this.sendDataReadyTimeout);
		this.sendDataReadyTimeout = null;
	}
}
export async function sendDataReady() {
	const { isAsk } = this;
	const source = this;
	if (isAsk) {
		this.setState(askRPC.sendDataReady);
	} else {
		this.setState(replyRPC.sendDataReady);
	}
	if (this.isReply && this.noData) {
		return this.completeReceived();
	}
	if (this.totalIncomingDataSize === 0) {
		return this.completeReceived();
	}
	this.sendDataReadyTimeout = setTimeout(() => {
		source.checkSendDataReady();
	}, this.latencyTimeout);
	const message = this.getPacketTemplate(7);
	return this.sendPacket(message);
}
