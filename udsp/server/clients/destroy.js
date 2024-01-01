import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function destroy(client, reason) {
	client.destroyed = true;
	if (client.destroyed) {
		return;
	}
	clearTimeout(client.gracePeriodTimeout);
	const server = client.server();
	console.log(`client destroyed: ${client.connectionIdString}`);
	if (reason === 1) {
		info(`client ended from inactivity. Grace period ended.
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}
		`);
	} else if (reason === 0) {
		info(`client ended due to natural causes.
			ID: ${client.connectionIdString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}
		`);
	}
	await server.removeClient(client);
	// Clear all client data
	client.ip = null;
	client.port = null;
	client.id = null;
	client.nonce = null;
	client.sessionKeys = null;
	client.encryptionKeypair = null;
	client.keypair = null;
	client.lastAct = null;
	client.server = null;
	client.source = null;
	client.destination = null;
	client.socket = null;
	client.source = null;
}
