import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(reply) {
	const {
		method = 'api',
		events,
		requestMethods
	} = reply;
	console.log('processEvent', method);
	console.log('processEvent head', reply.head);
	console.log('processEvent data', reply.data);
	// console.log(actions);
	const requestMethod = requestMethods.get(method);
	if (requestMethod) {
		console.log('methodFunction', requestMethod);
		const hasResponse = requestMethod(reply);
		return hasResponse;
	} else {
		return failed(`Invalid method name given.`, reply);
	}
}
