import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(request, response, source) {
	const { onRequest } = source;
	console.log('processEvent path', request.path);
	console.log('processEvent head', request.head);
	console.log('processEvent data', request.data);
	// console.log(actions);
	if (onRequest) {
		const hasResponse = onRequest(request, response, source);
		return hasResponse;
	} else {
		response.setHeader('status', 404);
		return;
	}
}
