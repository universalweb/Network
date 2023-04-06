import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
export async function received(client, message, options, server) {
	await server.nodeEvent('received', client);
	msgReceived(`client received data -> ID: ${client.id}`);
}
