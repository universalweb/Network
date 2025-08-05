//  TODO: CONSIDER MOVE TO GENERIC MODULE TO USE ON OTHER OBJECTS
export async function setState(state) {
	this.state = state;
	this.logInfo(`State Updated -> ${this.state}`);
	this.emitEvent('state', state);
}
export async function setReadyState(state) {
	this.readyState = state;
	this.logInfo(`READYState Updated -> ${this.readyState}`);
	this.emitEvent('readyState', state);
}
