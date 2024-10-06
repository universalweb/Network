import { eachArray } from '@universalweb/acid';
import { sendDataReady } from '../sendReady/sendDataReady.js';
export async function processHead() {
	if (this.headAssembled) {
		return console.log('Head already processed');
	}
	const {
		missingHeadPackets,
		incomingHead
	} = this;
	console.log('incomingHeadPackets', this.incomingHeadPackets);
	if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
		this.setHead();
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
	console.log('incomingHead', incomingHead);
}
