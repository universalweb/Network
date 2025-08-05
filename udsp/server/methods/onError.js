export async function onError(error) {
	console.trace(`server error:\n${error.stack}`);
	this.server.disconnect();
}
