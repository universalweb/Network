import { calcProgress } from '@universalweb/acid';
export async function onPathProgress() {
	if (this.totalIncomingPathSize) {
		if (this.currentIncomingPathSize > 0) {
			this.incomingPathProgress = calcProgress(this.currentIncomingPathSize, this.currentIncomingPathSize);
		}
		this.logInfo(`Path PROGRESS current:${this.currentIncomingPathSize}`, this.currentIncomingPathSize);
		this.logInfo('Incoming Progress', this.incomingPathProgress);
	}
}
