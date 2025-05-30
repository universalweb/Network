import { clientStates } from '../defaults.js';
import { sendEnd } from '../protocolEvents/end.js';
const {
	connectedState,
	closingState,
} = clientStates;
export async function closeSocket(message) {
	this.logInfo(`Client CLOSING. ${this.connectionIdString}`);
	this.clearIntroTimeout();
	if (this.state === connectedState) {
		await this.sendEnd();
	}
	this.removeClient();
	await this.setState(closingState);
	await this.setReadyState(2);
	await this.setDisconnected();
	await this.socket?.close();
	await this.setReadyState(3);
	this.fire(this.events, 'closed', this);
	this.logInfo(`Client CLOSED. ${this.connectionIdString}`);
	if (this.completeSynchronization) {
		this.completeSynchronization(false);
	}
}
