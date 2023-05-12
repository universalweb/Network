import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function send(client, message, headers, options, server) {
	await server.send(client, message, headers, options);
	await server.clientEvent('send', client);
	msgSent(`socket Sent -> ID: ${client.id}`);
}
