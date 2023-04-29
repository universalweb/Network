import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function destroy(client, reason, server) {
	if (reason === 1) {
		await client.send({
			status: 3
		});
		failed(`client ended from inactivity. Grace period ended.
			ID: ${client.id}
			Address: ${client.address}
			Port: ${client.port}
			`);
	} else if (reason === 0) {
		info(`client ended due to natural causes
			ID: ${client.id}
			Address: ${client.address}
			Port: ${client.port}
			`);
	}
	await server.nodeEvent('destroy', client);
	server.nodes.delete(client.id);
	client.address = null;
	client.port = null;
	client.id = null;
	client.nonce = null;
	client.transmitKey = null;
	client.receiveKey = null;
	client.lastAct = null;
}
