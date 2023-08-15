import { progress } from '@universalweb/acid';
export async function onData(message) {
	console.log('On Data event');
	if (this.totalIncomingDataSize) {
		if (this.currentIncomingDataSize > 0) {
			this.incomingProgress = progress(this.totalIncomingDataSize, this.currentIncomingDataSize);
		}
		console.log('Incoming Progress', this.incomingProgress);
	}
	if (this.events.data) {
		this.events.data(message.data, message.pid);
	}
}
