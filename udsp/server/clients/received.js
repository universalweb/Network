import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function received(client, message, options, server) {
	msgReceived(`client received data -> ID: ${client.id}`);
}
