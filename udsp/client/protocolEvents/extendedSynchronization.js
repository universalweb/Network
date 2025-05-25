import { extendedSynchronizationHeaderRPC } from '../../rpc/headerRPC.js';
import { extendedSynchronizationRPC } from '../../rpc/frameRPC.js';
export async function createExtendedSynchronization(header, frame) {
	this.logInfo('Creating Client Extended Synchronization');
	await this.keyExchange.onCreateClientExtendedSynchronization(this, this.destination, header, frame);
}
// const targetHeader = [];
// const targetFrame = [false, extendedSynchronizationRPC];
export async function sendExtendedSynchronization() {
	this.logInfo('Sending Client Extended Synchronization');
	const { destination } = this;
	const header = [];
	const frame = [];
	await this.createExtendedSynchronization(header, frame);
	await this.sendAny(frame, header);
}
export async function extendedSynchronizationHeader(header, packetDecoded) {
	this.logInfo('Client Extended Synchronization HEADER');
	if (this.keyExchange.clientExtendedSynchronizationHeader) {
		const status = await this.keyExchange.clientExtendedSynchronizationHeader(this, this.destination, header, packetDecoded);
		if (packetDecoded.noMessage && status !== false) {
			this.synchronized();
		}
	}
}
export async function extendedSynchronizationFrame(frame, header, rinfo) {
	this.logInfo('Client Extended Synchronization');
	if (this.keyExchange.clientExtendedSynchronizationFrame) {
		const status = await this.keyExchange.clientExtendedSynchronizationFrame(this, this.destination, frame, header);
		if (status !== false) {
			this.synchronized();
		}
	}
}
