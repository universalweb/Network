import { askRPC, defaultStage, replyRPC } from '../rpc/rpcCodes.js';
import { hasValue } from '@universalweb/utilitylib';
export async function checkSetupSent() {
	const { isAsk } = this;
	this.logInfo(`CHECK SETUP STATUS checkSetupSent - STATE:${this.state}`);
	if (isAsk) {
		if (this.state === askRPC.setup) {
			this.logInfo('STATE STILL 1 NEED TO RESEND SETUP');
			return this.sendSetup();
		}
	} else if (this.state === replyRPC.setup) {
		this.logInfo('STATE STILL 5 NEED TO RESEND SETUP');
		return this.sendSetup();
	}
	this.clearSetupTimeout();
}
export function clearSetupTimeout() {
	clearTimeout(this.setupTimeout);
	this.setupTimeout = null;
}
// TODO: CREATE A COMPACT SETUP PACKET SO THAT ALL DETAILS COULD BE IN ONE PACKET
// NOTE: Either raise number id type for stages to have a new setup type or just add a flag to show the mode for the setup type
// NOTE: Speed improvements are required to ensure there is no trade off from fast connection establishment and then lost in data transfer steps
// NOTE: Could use multiple Frame approach instead of setup mode might offer perks to not handle second setup frame before the first is verified
export async function sendSetup() {
	const source = this;
	const { isAsk } = this;
	this.logInfo('sendSetup', this.state);
	const message = this.getPacketTemplate(0);
	this.setupAttempts++;
	if (this.setupAttempts > 3) {
		this.logInfo('Intro Attempts Exceeded');
		return this.destroy();
	}
	if (isAsk) {
		message.push(this.method, this.outgoingPathSize, this.outgoingParametersSize, this.outgoingHeadSize);
		if (this.state === defaultStage) {
			this.setState(askRPC.setup);
		}
	} else {
		message.push(this.outgoingHeadSize);
		if (this.state === replyRPC.sendDataReady) {
			this.setState(replyRPC.setup);
		}
	}
	if (hasValue(this.outgoingDataSize)) {
		message.push(this.outgoingDataSize);
	}
	this.setupTimeout = setTimeout(() => {
		source.checkSetupSent();
	}, this.latencyTimeout);
	return this.sendPacket(message);
}
