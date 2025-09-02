import { eachArray } from '@universalweb/utilitylib';
export async function processParameters() {
	if (this.parametersAssembled) {
		return this.logInfo('Parameters already processed');
	}
	const {
		missingParametersPackets,
		incomingParameters
	} = this;
	this.logInfo('incomingParametersPackets', this.incomingParametersPackets);
	if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
		await this.setParameters();
	} else {
		eachArray(this.incomingParametersPackets, (item, index) => {
			if (!item) {
				if (!missingParametersPackets.has(index)) {
					missingParametersPackets.set(index, true);
				}
			}
		});
	}
	this.logInfo('incomingParameters', incomingParameters);
}
