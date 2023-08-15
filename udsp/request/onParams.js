import { progress } from '@universalweb/acid';
export async function onParams(message) {
	console.log('On Params event');
	if (this.totalIncomingParamsSize) {
		if (this.currentIncomingParamsSize > 0) {
			this.incomingProgress = progress(this.totalIncomingParamsSize, this.currentIncomingParamsSize);
		}
		console.log('Incoming Progress', this.incomingProgress);
	}
	if (this.events.params) {
		this.events.params(message.params, message.pid);
	}
}
