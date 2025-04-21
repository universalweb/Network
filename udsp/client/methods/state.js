export async function setState(state) {
	this.state = state;
	this.logInfo(`CLIENT State Updated -> ${this.state}`);
	await this.fire(this.events, 'state', this);
}
export async function setReadyState(state) {
	this.readyState = state;
	this.logInfo(`CLIENT READYState Updated -> ${this.readyState}`);
	await this.fire(this.events, 'readyState', this);
}
