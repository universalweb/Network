import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from 'msgpackr';
import { assign, isBuffer, } from 'Acid';
import {
	encrypt, nonceBox, toBase64, decrypt, boxUnseal
} from '#crypto';
import { createClient } from './server/clients/index.js';
export async function decodePacketHeaders(config) {
	const {
		source,
		packet: packetEncoded
	} = config;
	const destination = source.destination || config.destination;
	const { encryptKeypair } = destination;
	if (packetEncoded.length >= 1350) {
		console.log(packetEncoded);
		failed(`WARNING: Packet size is larger than max allowed size 1350 -> ${packetEncoded.length} over by ${packetEncoded.length - 1350}`);
	}
	const encryptConnectionId = (destination.isClient) ? destination.destination.encryptConnectionId : source.encryptConnectionId;
	info(`encryptConnectionId ${encryptConnectionId}`);
	const client = config.client;
	info(`Packet Encoded Size ${packetEncoded.length}`);
	const packet = decode(packetEncoded);
	info(`Packet Decoded Array Size ${packet.length}`);
	const headersEncoded = packet[0];
	info(`headersEncoded Size ${headersEncoded.length}`);
	if (!headersEncoded) {
		return failed(`No headers -> Invalid Packet`);
	}
	// Add single header support which holds only the binary data of the packet.id
	const headers = decode(headersEncoded);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	let headerIdEncoded;
	const isHeadersBuffer = isBuffer(headers);
	if (isHeadersBuffer) {
		headerIdEncoded = headers;
		info('Headers are in single header format');
	} else {
		headerIdEncoded = headers.id;
		info(`headers.id: ${toBase64(headers.id)}`);
	}
	if (!headerIdEncoded) {
		return failed(`No connection id in headers -> Invalid Packet`);
	}
	let headerId;
	if (headerIdEncoded.length > 24) {
		success('Server Connection ID Decrypted');
		headerId = boxUnseal(headerIdEncoded, encryptKeypair.publicKey, encryptKeypair.privateKey);
		if (!headerId) {
			return failed(headerIdEncoded, 'Packet ID Decrypt Failed');
		}
		if (!isHeadersBuffer) {
			headers.id = headerId;
		}
	} else if (!headers.id) {
		return failed(`No ID -> Invalid Packet`);
	}
	info(`clientId: ${toBase64(headers.id)}`);
	if (headers.key) {
		success(`Public Key is given -> Processing as create client`);
		console.log(toBase64(encryptKeypair.publicKey));
		const publicKey = boxUnseal(headers.key, destination.encryptKeypair.publicKey, destination.encryptKeypair.privateKey);
		if (!publicKey) {
			return failed(publicKey, 'Client Key Decrypt Failed');
		}
		headers.key = publicKey;
	} else {
		success(`No Public Key is given -> Processing as a message`);
	}
	console.log(headers);
	config.packetDecoded = {
		headers
	};
	config.packet = packet;
}
export async function decodePacket(config) {
	const {
		source,
		destination,
		packet,
		packetDecoded,
		packetDecoded: { headers, }
	} = config;
	const { nonce, } = headers;
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	} else if (footer) {
		packetDecoded.footer = footer;
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	info(`Transmit Key ${toBase64(destination.sessionKeys.receiveKey)}`);
	info(`nonce ${toBase64(nonce)}`);
	if (!packet[1]) {
		return failed(`No Encrypted Message - failed to decode -> Invalid Packet`);
	}
	info(`encryptedMessage ${packet[1].length} bytes`);
	const decryptedMessage = decrypt(packet[1], ad, nonce, destination.sessionKeys.receiveKey);
	if (!decryptedMessage) {
		return failed('Encryption failed');
	}
	info(`encryptedMessage ${decryptedMessage.length} bytes`);
	const message = decode(decryptedMessage);
	if (message.head) {
		success('head PAYLOAD', message.head.length);
	}
	if (message.body) {
		success('body PAYLOAD', message.body.length);
	}
	packetDecoded.message = message;
}
