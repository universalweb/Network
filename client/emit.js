import {
	success, failed, imported, msgSent, info
} from '#logs';
imported('Emit');
async function emit(api, body) {
	const thisContext = this;
	const { packetIdGenerator } = thisContext;
	info(`Emitted`);
	const eid = packetIdGenerator.get();
	const message = {
		api,
		eid,
		body
	};
	return thisContext.send(message);
}
