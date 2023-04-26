import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function emit(evnt, body) {
	info(`Emitted ${evnt}`);
	const eid = this.packetIdGenerator.get();
	const message = {
		evnt,
		eid,
		body
	};
	await this.send(message);
}
