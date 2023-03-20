import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
async function emit(api, body) {
	info(`Emitted ${api}`);
	const eid = this.packetIdGenerator.get();
	const message = {
		api,
		eid,
		body
	};
	await this.send(message);
}
