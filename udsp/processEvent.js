import { stringify, get } from 'Acid';
import { failed, info } from '#logs';
export async function processEvent(request, eventSource, source) {
	const {
		body,
		sid,
		evnt,
		act
	} = request;
	const {
		events,
		actions
	} = eventSource;
	const eventName = act || evnt;
	const method = (act) ? actions.get(act) : events.get(evnt);
	info(`Request:${eventName} RequestID: ${sid}`);
	if (method) {
		console.log(request);
		const hasResponse = await method(request, source);
		return;
	} else {
		return failed(`Invalid method name given. ${stringify(request)}`);
	}
}
