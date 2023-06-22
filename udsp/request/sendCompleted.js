import { sendPacket } from './sendPacket';
export async function sendCompleted() {
	const thisAsk = this;
	const { id: sid } = thisAsk;
	thisAsk.sendPacket({
		message: {
			sid,
			cmplt: true
		}
	});
}
