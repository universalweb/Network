import { askRPC, replyRPC } from '../rpc/rpcCodes.js';
import { hasValue } from '@universalweb/acid';
export async function checkSendPathReady() {
	const { isAsk } = this;
	this.logInfo(`CHECK SETUP STATUS checkSendPathReady - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.sendPathReady) {
			this.logInfo('NEED TO RESEND sendPathReady');
			return this.sendPathReady();
		}
	} else if (this.state === replyRPC.sendPathReady) {
		this.logInfo('NEED TO RESEND sendPathReady');
		return this.sendPathReady();
	}
	this.clearSendPathReadyTimeout();
}
export function clearSendPathReadyTimeout() {
	if (hasValue(this.sendPathReadyTimeout)) {
		this.logInfo('CLEAR sendPathReady TIMEOUT');
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
