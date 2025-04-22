import { extendedSynchronizationHeaderRPC } from '../../../rpc/headerRPC.js';
import { extendedSynchronizationRPC } from '../../../rpc/frameRPC.js';
import { sendPacketIfAny } from '#udsp/utilities/sendPacket';
// TODO: ADD CHECKS TO BLOCK ATTEMPTS TO SEND EXTENDED Synchronization IF NOT SUPPORTED ON KEY EXCHANGE ALGO
export async function extendedSynchronizationHeader(header, packetDecoded) {
	this.logInfo('extendedSynchronizationHeader CALLED');
	if (!this.keyExchange.serverExtendedSynchronizationHeader) {
		this.logInfo(`extendedSynchronizationHeader Asked but doesn't exist`);
		this.destroy(3);
		return;
	}
	await this.keyExchange.serverExtendedSynchronizationHeader(this, this.destination, header);
	if (packetDecoded.noMessage) {
		await this.sendExtendedSynchronization(null, header, packetDecoded);
	}
}
export async function extendedSynchronization(frame, header, rinfo) {
	this.logInfo('Server Extended Synchronization');
	if (!this.keyExchange.serverExtendedSynchronizationHeader) {
		this.logInfo(`Extended Synchronization Asked but doesn't exist`);
		this.destroy(3);
		return;
	}
	await this.keyExchange.serverExtendedSynchronization(this, this.destination, frame, header);
	await this.sendExtendedSynchronization(frame, header);
}
export async function sendExtendedSynchronization(frame, header) {
	this.logInfo('Sending Extended Synchronization');
	// const targetHeader = [extendedSynchronizationHeaderRPC];
	// const targetFrame = [false, extendedSynchronizationRPC];
	const targetHeader = [];
	const targetFrame = [];
	await this.keyExchange.sendServerExtendedSynchronization(this, this.destination, targetFrame, targetHeader);
	await this.sendAny(targetFrame, targetHeader);
}
