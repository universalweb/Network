import { calcProgress } from '@universalweb/acid';
export async function onHeadProgress() {
	if (this.totalIncomingHeadSize) {
		if (this.currentIncomingHeadSize > 0) {
			this.incomingHeadProgress = calcProgress(this.currentIncomingHeadSize, this.currentIncomingHeadSize);
		}
		console.log(`Head PROGRESS current:${this.currentIncomingHeadSize}`, this.currentIncomingHeadSize);
		console.log('Incoming Progress', this.incomingHeadProgress);
	}
}
