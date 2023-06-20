import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from 'msgpackr';
import { assign, isBuffer, isArray } from '@universalweb/acid';
import { toBase64 } from '#crypto';
import { createClient } from './server/clients/index.js';
export async function decodePacketHeaders(config) {
	const {
		source,
		destination,
		packet: packetEncoded
	} = config;
	const {
		encryptKeypair,
		connectionIdKeypair,
		cryptography,
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient
	} = destination;
	if (packetEncoded.length >= 1350) {
		failed(`WARNING: Packet size is larger than max allowed size 1350 -> ${packetEncoded.length} over by ${packetEncoded.length - 1350}`);
	}
	let encryptConnectionId;
	if (isServerEnd) {
		encryptConnectionId = cryptography.config.encryptServerConnectionId;
	} else {
		encryptConnectionId = cryptography.config.encryptClientConnectionId;
	}
	info(`encryptConnectionId ${encryptConnectionId}`);
	const client = config.client;
	info(`Packet Encoded Size ${packetEncoded.length}`);
	const packet = decode(packetEncoded);
	config.packet = packet;
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
	if (encryptConnectionId) {
		success('Server Connection ID Decrypted');
		// console.log(destination);
		if (encryptConnectionId === 'sealedbox') {
			if (isServerEnd) {
				headerId = cryptography.decryptServerConnectionId(headerIdEncoded, connectionIdKeypair);
			} else {
				headerId = cryptography.decryptClientConnectionId(headerIdEncoded, connectionIdKeypair);
			}
		}
		if (!headerId) {
			return failed(`Packet ID Decrypt Failed method given:${encryptConnectionId}`);
		}
		info(`clientId: ${toBase64(headerId)}`);
		if (isHeadersBuffer) {
			config.packetDecoded = {
				headers: headerId
			};
			return true;
		} else {
			headers.id = headerId;
		}
	} else if (!headers?.id && !headers) {
		return failed(`No ID -> Invalid Packet`);
	}
	if (headers.key) {
		success(`Public Key is given -> Processing as create client`);
		console.log(toBase64(encryptKeypair.publicKey));
		const {
			encryptClientKey,
			encryptServerKey
		} = cryptography.config;
		let publicKey = headers.key;
		if (isClient) {
			if (encryptClientKey === 'sealedbox') {
				publicKey = cryptography.decryptServerKey(headers.key, destination.encryptKeypair);
			}
		}
		if (isServerEnd) {
			if (encryptServerKey === 'sealedbox') {
				publicKey = cryptography.decryptClientKey(headers.key, destination.encryptKeypair);
			}
		}
		if (!publicKey) {
			return failed('Client Key Decrypt Failed');
		}
		headers.key = publicKey;
	} else {
		success(`No Public Key is given -> Processing as a message`);
	}
	// console.log(headers);
	config.packetDecoded = {
		headers
	};
	return true;
}
export async function decodePacket(config) {
	const {
		source,
		destination,
		packet,
		packetDecoded,
		packetDecoded: { headers, }
	} = config;
	const { cryptography, } = destination;
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	} else if (footer) {
		packetDecoded.footer = footer;
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	info(`Transmit Key ${toBase64(destination.sessionKeys.receiveKey)}`);
	if (!packet[1]) {
		return failed(`No Encrypted Message - failed to decode -> Invalid Packet`);
	}
	info(`encryptedMessage ${packet[1].length} bytes`);
	const decryptedMessage = cryptography.decrypt(packet[1], destination.sessionKeys, ad);
	if (!decryptedMessage) {
		return failed('Encryption failed');
	}
	info(`encryptedMessage ${decryptedMessage.length} bytes`);
	const message = decode(decryptedMessage);
	if (message.head) {
		console.log('head PAYLOAD', message.head);
	}
	if (message.body) {
		success('body PAYLOAD', message.body.length);
	}
	packetDecoded.message = message;
	return true;
}
