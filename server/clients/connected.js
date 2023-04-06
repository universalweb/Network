import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
export async function connected(client, server) {
	client.lastAct = Date.now();
	clearTimeout(client.gracePeriod);
	await server.nodeEvent('connected', client);
	success(`client Connected -> ID: ${client.id}`);
}
