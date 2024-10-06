import { eachArray } from '@universalweb/acid';
export async function processParameters() {
	if (this.parametersAssembled) {
		return console.log('Parameters already processed');
	}
	const {
		missingParametersPackets,
		incomingParameters
	} = this;
	console.log('incomingParametersPackets', this.incomingParametersPackets);
	if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
		this.setParameters();
	} else {
		eachArray(this.incomingParametersPackets, (item, index) => {
			if (!item) {
				if (!missingParametersPackets.has(index)) {
					missingParametersPackets.set(index, true);
				}
			}
		});
	}
	console.log('incomingParameters', incomingParameters);
}
