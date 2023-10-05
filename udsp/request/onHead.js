import { progress } from '@universalweb/acid';
export async function onHead(message) {
	console.log('On Head event');
	if (this.totalIncomingHeadSize) {
		if (this.currentIncomingHeadSize > 0) {
			this.incomingProgress = progress(this.totalIncomingHeadSize, this.currentIncomingHeadSize);
		}
		console.log('Incoming Progress', this.incomingProgress);
	}
	if (this.events.head) {
		this.events.head(message.head, message.packetId);
	}
}
