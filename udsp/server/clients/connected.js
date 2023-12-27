import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function connected(client) {
	client.lastAct = Date.now();
	clearTimeout(client.connectionGracePeriod);
	success(`client Connected -> ID: ${client.id}`);
}
