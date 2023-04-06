import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
export async function send(client, message, options, server) {
	await server.send(client, message, options);
	await server.nodeEvent('send', client);
	msgSent(`socket Sent -> ID: ${client.id}`);
}
