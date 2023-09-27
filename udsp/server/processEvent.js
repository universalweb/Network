import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(request, response, source) {
	const {
		events,
		requestMethods
	} = source;
	const { method } = request;
	console.log('processEvent', method);
	console.log('processEvent head', request.head);
	console.log('processEvent data', request.data);
	// console.log(actions);
	const requestMethod = requestMethods.get(method);
	if (requestMethod) {
		console.log('methodFunction', requestMethod);
		const hasResponse = requestMethod(request, response, source);
		return hasResponse;
	} else {
		return failed(`Invalid method name given.`, source);
	}
}
