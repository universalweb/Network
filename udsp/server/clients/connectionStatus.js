import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function connectionStatus(client, server) {
	client.lastConnectionStatusCheck = Date.now();
	await server.clientEvent('state', client);
	success(`client status check/update (state) -> ID: ${client.id}`);
}
