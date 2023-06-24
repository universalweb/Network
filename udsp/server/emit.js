import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function emit(evnt, data) {
	info(`Emitted ${evnt}`);
	const eid = this.packetIdGenerator.get();
	const message = {
		evnt,
		eid,
		data
	};
	await this.send(message);
}
