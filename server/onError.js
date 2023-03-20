import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
export async function onError(error) {
	failed(`server error:\n${error.stack}`);
}
