import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function connected(client, server) {
	client.lastAct = Date.now();
	clearTimeout(client.connectionGracePeriod);
	await server.clientEvent('connected', client);
	success(`client Connected -> ID: ${client.id}`);
}
