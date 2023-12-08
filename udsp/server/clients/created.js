export async function created(client) {
	const server = this.server();
	server.clientCreated(client);
}
