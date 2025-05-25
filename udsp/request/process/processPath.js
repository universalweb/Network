import { eachArray } from '@universalweb/acid';
import { sendParametersReady } from '../sendReady/sendParametersReady.js';
export async function processPath() {
	if (this.pathAssembled) {
		return this.logInfo('Path already processed');
	}
	const {
		missingPathPackets,
		incomingPath
	} = this;
	this.logInfo('incomingPathPackets', this.incomingPathPackets);
	this.logInfo('incomingPath', incomingPath);
	if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
		await this.setPath();
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
