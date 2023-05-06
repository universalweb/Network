import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt } from '#crypto';
import { decodePacket } from '#udsp/decodePacket';
imported('Server onMessage');
/**
	* @todo Do not encode head only body.
	* @todo Move SID and others to head.
	* @todo Move priority info to head.
 */
export async function onMessage(packetEncoded) {
	const {
		receiveKey,
		nonce
	} = this;
	msgReceived('Message Received');
	const packet = await decodePacket({
		receiveKey,
		nonce,
		packetEncoded
	});
	this.processMessage(packet);
}

