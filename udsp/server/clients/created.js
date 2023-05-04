export async function created(client, server) {
	server.nodeEvent('created', client);
}
