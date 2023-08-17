import { progress } from '@universalweb/acid';
export async function onParams(message) {
	console.log('On Params event');
	if (this.totalIncomingParametersSize) {
		if (this.currentIncomingParametersSize > 0) {
			this.incomingProgress = progress(this.totalIncomingParametersSize, this.currentIncomingParametersSize);
		}
		console.log('Incoming Progress', this.incomingProgress);
	}
	if (this.events.params) {
		this.events.params(message.params, message.pid);
	}
}
