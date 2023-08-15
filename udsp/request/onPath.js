import { progress } from '@universalweb/acid';
export async function onPath(message) {
	console.log('On Path event');
	if (this.totalIncomingPathSize) {
		if (this.currentIncomingPathSize > 0) {
			this.incomingProgress = progress(this.totalIncomingPathSize, this.currentIncomingPathSize);
		}
		console.log('Incoming Progress', this.incomingProgress);
	}
	if (this.events.path) {
		this.events.path(message.path, message.pid);
	}
}
