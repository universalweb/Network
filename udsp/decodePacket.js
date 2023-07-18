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
	const headerEncoded = packet[0];
	info(`headerEncoded Size ${headerEncoded.length}`);
	if (!headerEncoded) {
		return failed(`No header -> Invalid Packet`);
	}
	// Add single header support which holds only the binary data of the packet.id
	const headerDecoded = decode(headerEncoded);
	if (!headerDecoded) {
		return failed(`No header -> Invalid Packet`);
	}
	const header = isBuffer(headerDecoded) ? {
		id: headerDecoded
	} : headerDecoded;
	if (!header.id) {
		return failed(`No connection id in header -> Invalid Packet`);
	}
	if (encryptConnectionId) {
		success('Server Connection ID Decrypted');
		// console.log(destination);
		if (isServerEnd) {
			header.id = cryptography.decryptServerConnectionId(header.id, connectionIdKeypair);
		} else {
			header.id = cryptography.decryptClientConnectionId(header.id, connectionIdKeypair);
		}
		if (!header.id) {
			return failed(`Packet ID Decrypt Failed method given:${encryptConnectionId}`);
		}
	}
	info(`clientId: ${toBase64(header.id)}`);
	if (header.key) {
		success(`Public Key is given -> Processing as create client`);
		const { encryptClientKey } = cryptography.config;
		if (encryptClientKey) {
			header.key = cryptography.decryptClientKey(header.key, encryptKeypair);
		}
		console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(header.key));
		if (!header.key) {
			return failed('Client Key Decode Failed');
		}
	} else {
		success(`No Public Key is given -> Processing as a message`);
	}
	// console.log(header);
	config.packetDecoded = {
		header
	};
	return true;
}
export async function decodePacket(config) {
	const {
		source,
		destination,
		packet,
		packetDecoded,
		packetDecoded: { header, }
	} = config;
	const { cryptography, } = destination;
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	} else if (footer) {
		packetDecoded.footer = footer;
	}
	const messageEncoded = packet[1];
	if (header.error) {
		console.log('Critical Error', header.error);
		// can be returned if a server so chooses to respond to bad/mal/incorrect requests
		// can return unencrypted data
		if (messageEncoded) {
			packetDecoded.message = decode(messageEncoded);
		}
		return true;
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	console.log(destination);
	info(`Transmit Key ${toBase64(destination.sessionKeys.receiveKey)}`);
	if (messageEncoded) {
		info(`encryptedMessage ${messageEncoded.length} bytes`);
		const decryptedMessage = cryptography.decrypt(packet[1], destination.sessionKeys, ad);
		if (!decryptedMessage) {
			return failed('Encryption failed');
		}
		info(`encryptedMessage ${decryptedMessage.length} bytes`);
		const message = decode(decryptedMessage);
		if (message.head) {
			console.log('head PAYLOAD', message.head);
		}
		if (message.data) {
			success('data PAYLOAD', message.data?.length || message.data);
		}
		packetDecoded.message = message;
	} else {
		failed(`No Encrypted Message - failed to decode -> Invalid Packet`);
	}
	return true;
}
