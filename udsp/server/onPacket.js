import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import { decrypt } from '#crypto';
import { processPacket } from './processPacket.js';
import { processSocket } from './processSocket.js';
import { isEmpty } from 'Acid';
/**
	* @todo Do not encode head only body.
	* @todo Move SID and others to head.
	* @todo Move priority info to head.
 */
export async function onPacket(packet, connection) {
	const thisServer = this;
	msgReceived('Message Received');
	console.log(packet);
	const packetDecoded = decode(packet);
	if (isEmpty(packetDecoded)) {
		return failed(`No header buffer -> Invalid Packet`);
	}
	const headersBuffer = packetDecoded[0];
	if (!headersBuffer) {
		return failed(`No header buffer -> Invalid Packet`);
	}
	const messageBuffer = packetDecoded[1];
	if (!packet) {
		return failed(`No packet -> Invalid Packet`);
	}
	const headers = decode(headersBuffer);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	const footer = packetDecoded[2];
	if (!footer) {
		info(`No footer`);
	}
	success(`Packet`);
	const { key, } = headers;
	console.log('Headers', headers);
	if (key) {
		success(`Public Key is given -> Processing handshake`);
		await processSocket(thisServer, connection, headersBuffer, headers, messageBuffer);
	} else {
		success(`No Public Key is given -> Processing as a message`);
		await processPacket(thisServer, connection, headersBuffer, headers, messageBuffer);
	}
}
