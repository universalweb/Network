import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function send(client, message, options, server) {
	await server.send(client, message, options);
	await server.clientEvent('send', client);
	msgSent(`socket Sent -> ID: ${client.id}`);
}
