export async function destroy(client, destroyCode, errString) {
	if (client.destroyed) {
		return;
	}
	client.destroyed = true;
	client.clearInitialGracePeriodTimeout();
	const server = client.server();
	this.logInfo(`client destroyed: ${client.connectionIdString}`);
	if (errString) {
		this.logInfo(errString);
	}
	switch (destroyCode) {
		case 0: {
			this.logInfo(`client ended due to natural causes.
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}
		`);
			break;
		}
		case 1: {
			this.logInfo(`client ended from inactivity. Grace period ended.
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}`);
			break;
		}
		case 2: {
			this.logInfo(`client ended from invalid RPC given.
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}`);
			break;
		}
		case 3: {
			this.logInfo(`client destroyed
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}`);
			break;
		}
		default:
			break;
	}
	await server.removeClient(client);
	// Clear all client data
	client.ip = null;
	client.port = null;
	client.id = null;
	client.nonce = null;
	client.lastAct = null;
	client.server = null;
	client.source = null;
	client.destination = null;
	client.socket = null;
	client.source = null;
}
