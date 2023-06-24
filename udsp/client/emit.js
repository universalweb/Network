import {
	success, failed, imported, msgSent, info
} from '#logs';
imported('Emit');
export async function emit(evnt, data) {
	const thisContext = this;
	const { packetIdGenerator } = thisContext;
	info(`Emitted`);
	const eid = packetIdGenerator.get();
	const message = {
		evnt,
		eid,
		data
	};
	return thisContext.send(message);
}
