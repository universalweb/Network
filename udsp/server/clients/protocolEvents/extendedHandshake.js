import { extendedHandshakeHeaderRPC } from '../../../protocolHeaderRPCs.js';
import { extendedHandshakeRPC } from '../../../protocolFrameRPCs.js';
export async function extendedHandshakeHeader(header, packetDecoded) {
	console.log('extendedHandshakeHeader CALLED');
}
export async function extendedHandshake(frame, header, rinfo) {
	console.log('Server Extended Handshake');
	const { destination } = this;
	await this.cipherSuite.serverExtendedHandshake(this, destination, frame, header);
	await this.sendExtendedHandshake(frame, header);
}
export async function sendExtendedHandshake(frame, header) {
	const { destination } = this;
	console.log('Sending Extended Handshake');
	const targetHeader = [];
	const targetFrame = [false, extendedHandshakeRPC];
	await this.cipherSuite.sendServerExtendedHandshake(this, destination);
	await this.send(targetFrame, targetHeader);
}
