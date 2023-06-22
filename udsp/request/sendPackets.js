import { isBuffer } from '@universalweb/acid';
import { encode } from 'msgpackr';
import { bufferToOutgoingPackets } from './bufferToOutgoingPackets.js';
export async function send(incomingDataEncoding) {
	const response = this.response;
	const thisReply = this;
	console.log('Reply.send', response);
	if (response.body) {
		if (isBuffer(response.body)) {
			await bufferToOutgoingPackets(response, incomingDataEncoding);
		} else if (incomingDataEncoding === 'struct' || incomingDataEncoding === 'json' || !incomingDataEncoding) {
			response.body = encode(response.body);
			await bufferToOutgoingPackets(response, incomingDataEncoding);
		}
	}
	thisReply.replyAll();
}
