import { extendedHandshakeHeaderRPC } from '../../../protocolHeaderRPCs.js';
import { extendedHandshakeRPC } from '../../../protocolFrameRPCs.js';
import { sendPacketIfAny } from '#udsp/sendPacket';
// TODO: ADD CHECKS TO BLOCK ATTEMPTS TO SEND EXTENDED HANDSHAKE IF NOT SUPPORTED ON KEY EXCHANGE ALGO
export async function extendedHandshakeHeader(header, packetDecoded) {
	this.logInfo('extendedHandshakeHeader CALLED');
	if (!this.keyExchange.serverExtendedHandshakeHeader) {
		this.logInfo(`extendedHandshakeHeader Asked but doesn't exist`);
		this.destroy(3);
		return;
	}
	await this.keyExchange.serverExtendedHandshakeHeader(this, this.destination, header);
	if (packetDecoded.noMessage) {
		await this.sendExtendedHandshake(null, header, packetDecoded);
	}
}
export async function extendedHandshake(frame, header, rinfo) {
	this.logInfo('Server Extended Handshake');
	if (!this.keyExchange.serverExtendedHandshakeHeader) {
		this.logInfo(`Extended Handshake Asked but doesn't exist`);
		this.destroy(3);
		return;
	}
	await this.keyExchange.serverExtendedHandshake(this, this.destination, frame, header);
	await this.sendExtendedHandshake(frame, header);
}
export async function sendExtendedHandshake(frame, header) {
	this.logInfo('Sending Extended Handshake');
	// const targetHeader = [extendedHandshakeHeaderRPC];
	// const targetFrame = [false, extendedHandshakeRPC];
	const targetHeader = [];
	const targetFrame = [];
	await this.keyExchange.sendServerExtendedHandshake(this, this.destination, targetFrame, targetHeader);
	await this.sendAny(targetFrame, targetHeader);
}
