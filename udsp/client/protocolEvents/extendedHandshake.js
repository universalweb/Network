import { extendedHandshakeHeaderRPC } from '../../protocolHeaderRPCs.js';
import { extendedHandshakeRPC } from '../../protocolFrameRPCs.js';
export async function sendExtendedHandshake(frame, header, rinfo) {
	this.logInfo('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [];
	const targetFrame = [false, extendedHandshakeRPC];
	await this.keyExchange.sendClientExtendedHandshake(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function sendExtendedHandshakeHeader(frame, header, rinfo) {
	this.logInfo('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [];
	targetHeader[1] = extendedHandshakeHeaderRPC;
	const targetFrame = [];
	await this.keyExchange.sendClientExtendedHandshakeHeader(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function extendedHandshakeHeader(frame, header, rinfo) {
	this.logInfo('Client Extended Handshake');
	const { destination } = this;
	if (this.keyExchange.clientExtendedHandshake) {
		await this.keyExchange.clientExtendedHandshakeHeader(this, destination, frame, header);
	}
}
export async function extendedHandshake(frame, header, rinfo) {
	this.logInfo('Client Extended Handshake');
	const { destination } = this;
	if (this.keyExchange.clientExtendedHandshake) {
		await this.keyExchange.clientExtendedHandshake(this, destination, frame, header);
	}
	this.handshaked();
}
