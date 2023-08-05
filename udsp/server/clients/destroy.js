import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function destroy(client, reason, server) {
	console.log(`client destroyed: ${client.idString}`);
	if (reason === 1) {
		await client.send({
			state: 3
		});
		info(`client ended from inactivity. Grace period ended.
			ID: ${client.idString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}
		`);
	} else if (reason === 0) {
		info(`client ended due to natural causes.
			ID: ${client.idString}
			Address: ${client.destination.ip}
			Port: ${client.destination.port}
		`);
	}
	await server.clientEvent('destroy', client);
	server.clients.delete(client.idString);
	// Clear all client data
	client.ip = null;
	client.port = null;
	client.id = null;
	client.nonce = null;
	client.sessionKeys = null;
	client.encryptKeypair = null;
	client.keypair = null;
	client.lastAct = null;
	client.server = null;
	client.destination = null;
	client.socket = null;
	client.source = null;
}
