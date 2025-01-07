import { extendedHandshakeHeaderRPC } from '../../protocolHeaderRPCs.js';
import { extendedHandshakeRPC } from '../../protocolFrameRPCs.js';
export async function sendExtendedHandshake(frame, header, rinfo) {
	console.log('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [];
	const targetFrame = [false, extendedHandshakeRPC];
	await this.cipherSuite.sendClientExtendedHandshake(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function sendExtendedHandshakeHeader(frame, header, rinfo) {
	console.log('Sending Client Extended Handshake');
	const { destination } = this;
	const targetHeader = [extendedHandshakeHeaderRPC];
	const targetFrame = [];
	await this.cipherSuite.sendClientExtendedHandshakeHeader(this, destination, targetFrame, targetHeader);
	await this.send(targetFrame, targetHeader);
}
export async function extendedHandshake(frame, header, rinfo) {
	console.log('Client Extended Handshake');
	const { destination } = this;
	if (this.cipherSuite.clientExtendedHandshake) {
		await this.cipherSuite.clientExtendedHandshake(this, destination);
	}
	this.handshaked();
}
