import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt } from '#crypto';
import { decodePacket } from '#udsp/decodePacket';
imported('Server onMessage');
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

