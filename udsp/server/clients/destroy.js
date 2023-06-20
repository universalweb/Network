import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function destroy(client, reason, server) {
	console.log(`client destroyed: ${client.idString}`);
	if (reason === 1) {
		await client.send({
			status: 3
		});
		info(`client ended from inactivity. Grace period ended.
			ID: ${client.id}
			Address: ${client.ip}
			Port: ${client.port}
			`);
	} else if (reason === 0) {
		info(`client ended due to natural causes
			ID: ${client.id}
			Address: ${client.ip}
			Port: ${client.port}
			`);
	}
	await server.clientEvent('destroy', client);
	server.clients.delete(client.idString);
	client.ip = null;
	client.port = null;
	client.id = null;
	client.nonce = null;
	client.transmitKey = null;
	client.receiveKey = null;
	client.lastAct = null;
}
