export async function extendedHandshakeHeader(header, packetDecoded) {
	console.log('extendedHandshakeHeader CALLED');
}
export async function extendedHandshake(frame, header, rinfo) {
	console.log('Server Extended Handshake');
	const { destination } = this;
	await this.cipherSuite.serverExtendedHandshake(this, destination, frame, header);
	await this.sendExtendedHandshake(header, frame);
}
export async function sendExtendedHandshake(header, packetDecoded) {
	const { destination } = this;
	console.log('Sending Extended Handshake');
	const extendedHandshakeFrame = await this.cipherSuite.sendServerExtendedHandshake(this, destination);
	await this.send(extendedHandshakeFrame);
}
