import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function onError(error) {
	console.trace(`server error:\n${error.stack}`);
	this.server.disconnect();
}
