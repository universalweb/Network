export async function callOnDataSyncEvent(message) {
	this.logInfo('callOnDataSyncEvent', message.packetId);
	// TODO: CHANGE ARGS
	this.emitEvent('dataSync', message.data, message.packetId);
}
export async function onDataSync(message) {
	const source = this;
	if (source.hasEvent('dataSync')) {
		const { packetId } = message;
		const { incomingDataPackets } = this;
		if (packetId === this.onDataCurrentId) {
			await source.callOnDataSyncEvent(message);
			const nextId = this.onDataCurrentId++;
			let currentMessage = source.incomingDataPackets[this.onDataCurrentId];
			// TODO: ADD EXIT CONDITION MAX
			while (currentMessage) {
				await source.callOnDataSyncEvent(currentMessage);
				this.onDataCurrentId++;
				currentMessage = source.incomingDataPackets[this.onDataCurrentId];
			}
		}
	}
}
