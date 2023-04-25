import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function send(client, message, options, server) {
	await server.server.send(client, message, options);
	await server.nodeEvent('send', client);
	msgSent(`socket Sent -> ID: ${client.id}`);
}
