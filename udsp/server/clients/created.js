export async function created(client, server) {
	server.clientEvent('created', client);
}
