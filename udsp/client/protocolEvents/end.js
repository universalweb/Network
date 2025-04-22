import { clientStates } from '../defaults.js';
import { endRPC } from '#udsp/rpc/frameRPC';
const {
	inactiveState,
	connectingState,
	connectedState,
	closingState,
	closedState,
	destroyingState,
	destroyedState
} = clientStates;
export async function sendEnd() {
	if (this.state === connectingState || this.state === connectedState || this.state === closingState) {
		this.logInfo('Sending CLIENT END');
		const frame = [false, endRPC];
		return this.send(frame, false, null, true);
	}
}
export async function end(frame, header) {
	this.close('Server Ended Connection');
}
