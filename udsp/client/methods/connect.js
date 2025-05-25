import { clientStates } from '../defaults.js';
import { promise } from '@universalweb/acid';
const {
	connectedState,
	closingState,
	closedState,
	destroyingState,
	destroyedState
} = clientStates;
export async function connect() {
	if (!this.destination.ip) {
		this.logInfo(`Can't connect - No Destination IP`);
		return;
	} else if (this.state === connectedState) {
		this.logInfo('ALREADY CONNECTED');
		return this;
	} else if (this.completeSynchronization) {
		return this.awaitSynchronization;
	}
	this.awaitSynchronization = promise((accept) => {
		this.logInfo('Synchronization AWAITING');
		this.completeSynchronization = accept;
	});
	this.sendIntro();
	return this.awaitSynchronization;
}
export async function setDisconnected() {
	this.connected = null;
	await this.setState(closedState);
	await this.setReadyState(3);
	this.fire(this.events, 'disconnected', this);
}
export async function reconnect(options) {
	if (this.state === closedState) {
		await this.initialize(options || this.options);
		await this.connect();
	}
}
export async function setConnected() {
	this.connected = true;
	await this.setState(connectedState);
	await this.setReadyState(1);
	this.latency = (Date.now() - this.introTimestamp) + 100;
	this.logInfo(`CLIENT CONNECTED. Latency: ${this.latency}ms`);
	this.fire(this.events, 'connected', this);
}
