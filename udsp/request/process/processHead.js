import { eachArray } from '@universalweb/utilitylib';
import { sendDataReady } from '../sendReady/sendDataReady.js';
export async function processHead() {
	if (this.headAssembled) {
		return this.logInfo('Head already processed');
	}
	const {
		missingHeadPackets,
		incomingHead,
	} = this;
	this.logInfo('incomingHeadPackets', this.incomingHeadPackets);
	if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
		await this.setHead();
		this.sendDataReady();
	} else {
		eachArray(this.incomingHeadPackets, (item, index) => {
			if (!item) {
				if (!missingHeadPackets.has(index)) {
					missingHeadPackets.set(index, true);
				}
			}
		});
	}
	this.logInfo('incomingHead', incomingHead);
}
