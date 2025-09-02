import { clientStates } from '../defaults.js';
import { promise } from '@universalweb/utilitylib';
const {
	connectedState,
	closingState,
	closedState,
	destroyingState,
	destroyedState,
} = clientStates;
export async function connect() {
	if (!this.destination.ip) {
		this.logError(`Can't connect - No Destination IP`, this.destination);
		return false;
	} else if (this.state === connectedState) {
		this.logVerbose('ALREADY CONNECTED');
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
	this.emitEvent('disconnected');
}
export async function reconnect(options) {
	if (this.state === closedState) {
		await this.initialize(options || this.options);
		await this.connect();
	}
}
export async function setConnected() {
	// TODO: REMOVE CONNECTED PROPERTY NO NEED USE STATE
	this.connected = true;
	await this.setState(connectedState);
	await this.setReadyState(1);
	this.latency = (Date.now() - this.introTimestamp) + 100;
	this.logSuccess(`CLIENT CONNECTED. Latency: ${this.latency}ms`);
	this.emitEvent('connected');
}
