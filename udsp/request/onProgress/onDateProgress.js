import { calcProgress } from '@universalweb/acid';
export async function onDataProgress() {
	if (this.totalIncomingDataSize) {
		if (this.currentIncomingDataSize > 0) {
			this.incomingDataProgress = calcProgress(this.totalIncomingDataSize, this.currentIncomingDataSize);
		}
		console.log(`DATA PROGRESS current:${this.currentIncomingDataSize}`, this.totalIncomingDataSize);
		console.log('Incoming Progress', this.incomingDataProgress);
	}
}
