import { clientStates } from '../defaults.js';
import { sendEnd } from '../protocolEvents/end.js';
const {
	connectedState,
	closingState,
} = clientStates;
export async function closeSocket(message) {
	await this.clearIntroTimeout();
	if (this.state === connectedState) {
		await this.sendEnd();
	}
	await this.removeClient();
	await this.setState(closingState);
	await this.setReadyState(2);
	await this.setDisconnected();
	await this.socket?.close();
	await this.setReadyState(3);
	if (this.completeSynchronization) {
		await this.completeSynchronization(false);
	}
	this.emitEvent('closed', message);
}
