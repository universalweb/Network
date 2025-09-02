export async function destroy(destroyCode, errString) {
	if (this.destroyed) {
		return;
	}
	const server = this.server;
	this.destroyed = true;
	this.clearInitialGracePeriodTimeout();
	this.logInfo(`client destroyed: ${this.connectionIdString}`);
	if (errString) {
		this.logInfo(errString);
	}
	switch (destroyCode) {
		case 0: {
			this.logInfo(`client ended due to natural causes.
			ID: ${this.connectionIdString}
			Address: ${this.destination.ip}
			Port: ${this.destination.port}
		`);
			break;
		}
		case 1: {
			this.logInfo(`client ended from inactivity. Grace period ended.
			ID: ${this.connectionIdString}
			Address: ${this.destination.ip}
			Port: ${this.destination.port}`);
			break;
		}
		case 2: {
			this.logInfo(`client ended from invalid RPC given.
			ID: ${this.connectionIdString}
			Address: ${this.destination.ip}
			Port: ${this.destination.port}`);
			break;
		}
		case 3: {
			this.logInfo(`client destroyed
			ID: ${this.connectionIdString}
			Address: ${this.destination.ip}
			Port: ${this.destination.port}`);
			break;
		}
		default:
			break;
	}
	await server.removeClient(this);
	// Clear all client data
	this.ip = null;
	this.port = null;
	this.id = null;
	this.nonce = null;
	this.lastAct = null;
	this.server = null;
	this.source = null;
	this.destination = null;
	this.socket = null;
	this.source = null;
}
