import { clear, eachArray } from '@universalweb/acid';
export async function processData() {
	this.logInfo('Checking Data');
	const { missingDataPackets } = this;
	if (this.compiledDataAlready) {
		return true;
	}
	if (this.totalIncomingDataSize === this.currentIncomingDataSize) {
		clear(this.incomingDataPackets);
		if (this.isAsk) {
			if (this.incomingData.length) {
				this.response.dataBuffer = Buffer.concat(this.incomingData);
			}
		} else if (this.incomingData.length) {
			this.request.dataBuffer = Buffer.concat(this.incomingData);
		}
		return this.completeReceived();
	}
	eachArray(this.incomingDataPackets, (item, index) => {
		if (missingDataPackets.has(index)) {
			missingDataPackets.set(index, true);
		}
	});
	if (missingDataPackets.size !== 0) {
		this.logInfo('Missing packets: ', missingDataPackets);
	}
}
