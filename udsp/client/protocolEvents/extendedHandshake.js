import { extendedHandshakeHeaderRPC } from '../../protocolHeaderRPCs.js';
export async function sendExtendedHandshake(frame, header, rinfo) {
	console.log('Sending Client Extended Handshake');
	const { destination } = this;
	const extendedHandshakeHeader = [extendedHandshakeHeaderRPC];
	const extendedHandshakeFrame = await this.cipherSuite.sendClientExtendedHandshake(this, destination);
	await this.send(extendedHandshakeFrame, extendedHandshakeHeader);
}
export async function extendedHandshake(frame, header, rinfo) {
	console.log('Client Extended Handshake');
	const { destination } = this;
	await this.cipherSuite.clientExtendedHandshake(this, destination);
	this.handshaked();
}
