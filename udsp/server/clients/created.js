export async function created() {
	const server = this.server();
	server.clientCreated(this);
}
