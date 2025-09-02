import { calcProgress } from '@universalweb/utilitylib';
export async function onParamatersProgress() {
	if (this.totalIncomingParamatersSize) {
		if (this.currentIncomingParamatersSize > 0) {
			this.incomingParamatersProgress = calcProgress(this.currentIncomingParamatersSize, this.currentIncomingParamatersSize);
		}
		this.logInfo(`Paramaters PROGRESS current:${this.currentIncomingParamatersSize}`, this.currentIncomingParamatersSize);
		this.logInfo('Incoming Progress', this.incomingParamatersProgress);
	}
}
