import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function destroy(client, reason, server) {
	console.log(`client destroyed: ${client.connectionIdString}`);
	if (reason === 1) {
		await client.send({
			state: 3
		});
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
	await server.clientEvent('destroy', client);
	server.clients.delete(client.connectionIdString);
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
	client.destination = null;
	client.socket = null;
	client.source = null;
}
