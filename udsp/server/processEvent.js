import { failed, info } from '#logs';
import { get, hasValue, stringify } from '@universalweb/utilitylib';
export async function processEvent(request, response, source) {
	const { onRequest } = source;
	console.log('processEvent method', request.method);
	console.log('processEvent path', request.path);
	console.log('processEvent parameters', request.parameters);
	console.log('processEvent head', request.head);
	console.log('processEvent data', request.data);
	// console.log(actions);
	if (onRequest) {
		onRequest(request, response, source);
	} else {
		response.setHeader('status', 404);
		response.send();
	}
}
