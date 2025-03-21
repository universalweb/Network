export async function onError(error) {
	this.server.disconnect();
	console.trace(`server error:\n${error.stack}`);
}
