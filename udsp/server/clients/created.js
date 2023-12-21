export async function created(client) {
	const server = client.server();
	server.clientCreated(client);
}
