import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from 'msgpackr';
import { assign, } from 'Acid';
import {
	encrypt, nonceBox, toBase64, hashSign, decrypt, boxUnseal, sessionKeys
} from '#crypto';
import { createClient } from './server/clients/index.js';
export function decodePacketHeaders(config) {
	const {
		connection,
		isClient,
		isServer,
		options,
		packetEncoded,
		server,
		source,
		state
	} = config;
	const client = config.client;
	info(`Packet Encoded Size ${packetEncoded.length}`);
	const packet = decode(packetEncoded);
	const headersEncoded = packet[0];
	if (!headersEncoded) {
		return failed(`No headers -> Invalid Packet`);
	}
	const headers = decode(headersEncoded);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	if (headers.key) {
		success(`Public Key is given -> Processing as create client`);
	} else {
		success(`No Public Key is given -> Processing as a message`);
		console.log(headers);
	}
	config.headers = headers;
	config.packet = packet;
	return headers;
}
export async function decodePacket(config, result) {
	const {
		connection,
		isClient,
		isServer,
		options,
		packetEncoded,
		server,
		source,
		state,
		headers,
		client,
		packet,
		receiveKey
	} = config;
	const compiledPacket = {};
	const { nonce, } = headers;
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	console.log(receiveKey);
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
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(receiveKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	info(`Decode Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	compiledPacket.headers = headers;
	compiledPacket.message = message;
	if (footer) {
		compiledPacket.footer = footer;
	}
	info(`Encrypted Message Size: ${packetEncoded.length}`);
	return compiledPacket;
}
