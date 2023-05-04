import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function onError(error) {
	failed(`server error:\n${error.stack}`);
}
