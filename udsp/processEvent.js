import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(reply) {
	const {
		method = 'api',
		events,
		actions
	} = reply;
	console.log('processEvent', method);
	console.log('processEvent head', reply.head);
	console.log('processEvent data', reply.data);
	// console.log(actions);
	const methodFunction = actions.get(method);
	if (methodFunction) {
		console.log('methodFunction', methodFunction);
		const hasResponse = methodFunction(reply);
		return hasResponse;
	} else {
		return failed(`Invalid method name given.`, reply);
	}
}
