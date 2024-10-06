import { calcProgress } from '@universalweb/acid';
export async function onParamatersProgress() {
	if (this.totalIncomingParamatersSize) {
		if (this.currentIncomingParamatersSize > 0) {
			this.incomingParamatersProgress = calcProgress(this.currentIncomingParamatersSize, this.currentIncomingParamatersSize);
		}
		console.log(`Paramaters PROGRESS current:${this.currentIncomingParamatersSize}`, this.currentIncomingParamatersSize);
		console.log('Incoming Progress', this.incomingParamatersProgress);
	}
}
