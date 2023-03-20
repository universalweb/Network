import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import {
	encode,
	decode
} from 'msgpackr';
import { decrypt } from '../utilities/crypto.js';
export async function onMessage(messageBuffer, connection) {
	msgReceived('Message Received');
	console.log(messageBuffer);
	const headersEndIndex = Number(messageBuffer.slice(0, 3));
	if (!headersEndIndex) {
		return failed(`No headers size number -> Invalid Packet`);
	}
	success(`Additional Data size ${headersEndIndex - 3}`);
	const headersBuffer = messageBuffer.slice(3, headersEndIndex);
	const headers = decode(headersBuffer);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	success(`Additional Data`);
	console.log(headers);
	const packetEndIndex = Number(messageBuffer.slice(headersEndIndex, headersEndIndex + 4));
	if (!packetEndIndex) {
		return failed(`No packet size number -> Invalid Packet`);
	}
	success(`Packet size ${packetEndIndex}`);
	console.log(headersEndIndex + 4, packetEndIndex);
	const packet = messageBuffer.slice(headersEndIndex + 4, packetEndIndex);
	if (!packet) {
		return failed(`No packet -> Invalid Packet`);
	}
	success(`Packet`);
	const {
		key,
		sig
	} = headers;
	console.log('Headers', headers);
	if (key && sig) {
		success(`Public Key is given -> Processing handshake`);
		await this.processSocketCreation(connection, headersBuffer, headers, packet);
	} else {
		success(`No Public Key is given -> Processing as a message`);
		await this.processMessage(connection, headersBuffer, headers, packet);
	}
}
