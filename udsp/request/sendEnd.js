import { sendPacket } from './sendPacket.js';
export async function sendEnd() {
	const thisAsk = this;
	const { id: sid } = thisAsk;
	thisAsk.sendPacket({
		message: {
			sid,
			end: true
		}
	});
}
