import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function received(client, message, options) {
	msgReceived(`client received data -> ID: ${client.id}`);
}
