import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function onError(error) {
	console.trace(`server error:\n${error.stack}`);
	this.server.disconnect();
}
