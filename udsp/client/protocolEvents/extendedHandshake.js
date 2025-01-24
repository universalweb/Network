import { extendedHandshakeHeaderRPC } from '../../protocolHeaderRPCs.js';
import { extendedHandshakeRPC } from '../../protocolFrameRPCs.js';
export async function sendExtendedHandshake(frame, header, rinfo) {
	console.log('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [];
	const targetFrame = [false, extendedHandshakeRPC];
	await this.cipherSuite.keyExchange.sendClientExtendedHandshake(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function sendExtendedHandshakeHeader(frame, header, rinfo) {
	console.log('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [extendedHandshakeHeaderRPC];
	const targetFrame = [];
	await this.cipherSuite.keyExchange.sendClientExtendedHandshakeHeader(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function extendedHandshake(frame, header, rinfo) {
	console.log('Client Extended Handshake');
	const { destination } = this;
	if (this.cipherSuite.keyExchange.clientExtendedHandshake) {
		await this.cipherSuite.keyExchange.clientExtendedHandshake(this, destination);
	}
	this.handshaked();
}
