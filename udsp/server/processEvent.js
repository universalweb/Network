import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(request, response, source) {
	const { requestMethods } = source;
	const { method } = request;
	console.log(request.path);
	console.log('processEvent', method);
	console.log('processEvent head', request.head);
	console.log('processEvent data', request.data);
	// console.log(actions);
	const requestMethod = requestMethods[method];
	if (requestMethod) {
		const hasResponse = requestMethod.call(source, request, response);
		return hasResponse;
	} else {
		return console.trace(`Invalid method name given.`, source);
	}
}
