import { calcProgress } from '@universalweb/utilitylib';
export async function onHeadProgress() {
	if (this.totalIncomingHeadSize) {
		if (this.currentIncomingHeadSize > 0) {
			this.incomingHeadProgress = calcProgress(this.currentIncomingHeadSize, this.currentIncomingHeadSize);
		}
		this.logInfo(`Head PROGRESS current:${this.currentIncomingHeadSize}`, this.currentIncomingHeadSize);
		this.logInfo('Incoming Progress', this.incomingHeadProgress);
	}
}
