import {
	success, failed, imported, msgSent, info
} from '#logs';
imported('Emit');
export async function emit(evnt, body) {
	const thisContext = this;
	const { packetIdGenerator } = thisContext;
	info(`Emitted`);
	const eid = packetIdGenerator.get();
	const message = {
		evnt,
		eid,
		body
	};
	return thisContext.send(message);
}
