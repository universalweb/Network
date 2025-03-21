import { calcProgress } from '@universalweb/acid';
export async function onDataProgress() {
	if (this.totalIncomingDataSize) {
		if (this.currentIncomingDataSize > 0) {
			this.incomingDataProgress = calcProgress(this.totalIncomingDataSize, this.currentIncomingDataSize);
		}
		this.logInfo(`DATA PROGRESS current:${this.currentIncomingDataSize}`, this.totalIncomingDataSize);
		this.logInfo('Incoming Progress', this.incomingDataProgress);
	}
}
