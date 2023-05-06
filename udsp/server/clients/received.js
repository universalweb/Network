import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function received(client, message, options, server) {
	await server.clientEvent('received', client);
	msgReceived(`client received data -> ID: ${client.id}`);
}
