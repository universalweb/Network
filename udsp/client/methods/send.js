import { sendPacket, sendPacketIfAny } from '../../utilities/sendPacket.js';
import { clientStates } from '../defaults.js';
const { closingState, } = clientStates;
export async function send(frame, header, footer, repeat) {
	if (!this.destination.ip) {
		this.logInfo(`Can't send - No Destination IP`);
		return;
	}
	if (this.state >= closingState) {
		this.logInfo(`Can't send - Connection Closed`);
		return false;
	}
	this.logInfo(`client.send to Server`);
	if (this.socket) {
		return sendPacket(frame, this, this.socket, this.destination, header, footer, repeat);
	}
}
export async function sendAny(frame, headers, footer, repeat) {
	this.infoLog(`socket sendPacketIfAny -> ID: ${this.connectionIdString}`);
	if (this.destroyed) {
		return;
	}
	return sendPacketIfAny(frame, this, this.socket, this.destination, headers, footer, repeat);
}
