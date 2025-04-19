import { sendPacket, sendPacketIfAny } from '#udsp/sendPacket';
export async function send(frame, headers, footer) {
	this.logInfo(`socket Sent -> ID: ${this.connectionIdString}`);
	if (this.destroyed) {
		return;
	}
	return sendPacket(frame, this, this.socket, this.destination, headers, footer);
}
export async function sendAny(frame, headers, footer) {
	this.logInfo(`socket sendPacketIfAny -> ID: ${this.connectionIdString}`);
	if (this.destroyed) {
		return;
	}
	return sendPacketIfAny(frame, this, this.socket, this.destination, headers, footer);
}
