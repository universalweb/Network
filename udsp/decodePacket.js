import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from 'msgpackr';
import { assign, } from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign,
	decrypt,
	boxUnseal
} from '#crypto';
export async function decodePacket(config) {
	const {
		receiveKey,
		state,
		options,
		client,
		packetEncoded,
		source
	} = config;
	msgReceived(`Packet Size ${packetEncoded.length}`);
	const packet = decode(packetEncoded);
	const headersEncoded = packet[0];
	if (!headersEncoded) {
		return failed(`No headers -> Invalid Packet`);
	}
	const headers = decode(headersEncoded);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	const {
		id,
		nonce
	} = headers;
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	const encryptedMessage = decrypt(packet[1], ad, nonce, receiveKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const message = decode(encryptedMessage);
	if (message.head) {
		success('head PAYLOAD', message.head.length);
	}
	if (message.body) {
		success('body PAYLOAD', message.body.length);
	}
	info('Raw Message', headers, message);
	info(`clientId: ${headers.id}`);
	info(`Transmit Key ${toBase64(receiveKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	success(`Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	return {
		headers,
		message,
		footer
	};
}
