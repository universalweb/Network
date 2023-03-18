import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import {
	encode,
	decode
} from 'msgpackr';
import { decrypt } from '../utilities/crypto.js';
imported('Server onMessage');
export async function onMessage(messageBuffer, connection) {
	const thisContext = this;
	const { receiveKey, } = thisContext;
	msgReceived('Message Received');
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
	console.log(packet);
	const nonce = headers.nonce;
	const decrypted = decrypt(packet, headersBuffer, nonce, receiveKey);
	if (!decrypted) {
		return failed(`Decrypt Failed`);
	}
	const message = decode(decrypted);
	console.log(message);
	if (message) {
		if (message.head) {
			message.head = decode(message.head);
		}
		if (message.body) {
			message.body = decode(message.body);
		}
		thisContext.processMessage(message, headers);
	}
}

