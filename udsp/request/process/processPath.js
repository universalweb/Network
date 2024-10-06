import { eachArray } from '@universalweb/acid';
import { sendParametersReady } from '../sendReady/sendParametersReady.js';
export async function processPath() {
	if (this.pathAssembled) {
		return console.log('Path already processed');
	}
	const {
		missingPathPackets,
		incomingPath
	} = this;
	console.log('incomingPathPackets', this.incomingPathPackets);
	console.log('incomingPath', incomingPath);
	if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
		this.setPath();
		this.sendParametersReady();
	} else {
		eachArray(this.incomingPathPackets, (item, index) => {
			if (!item) {
				if (!missingPathPackets.has(index)) {
					missingPathPackets.set(index, true);
				}
			}
		});
	}
}
