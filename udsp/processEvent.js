import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(reply) {
	console.log(reply);
	const {
		sid,
		method
	} = reply.request;
	const {
		events,
		actions
	} = reply.server();
	const methodFunction = actions.get(method) || 'api';
	if (hasValue(sid)) {
		if (methodFunction) {
			info(`Action:${methodFunction} RequestID: ${sid}`);
		}
	}
	if (methodFunction) {
		console.log(reply);
		const hasResponse = await method(reply);
		return;
	} else {
		return failed(`Invalid method name given.`, reply);
	}
}
