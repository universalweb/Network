import { stringify, get, hasValue } from '@universalweb/acid';
import { failed, info } from '#logs';
export async function processEvent(reply) {
	console.log(reply);
	const {
		sid,
		act
	} = reply.request;
	const {
		events,
		actions
	} = reply.server();
	const method = actions.get(act);
	if (hasValue(sid)) {
		if (act) {
			info(`Action:${act} RequestID: ${sid}`);
		}
	}
	if (method) {
		console.log(reply);
		const hasResponse = await method(reply);
		return;
	} else {
		return failed(`Invalid method name given.`, reply);
	}
}
