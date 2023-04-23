import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function state(client, server) {
	client.stateTime = Date.now();
	await server.nodeEvent('state', client);
	success(`client status check/update (state) -> ID: ${client.id}`);
}
