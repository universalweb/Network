import {
	assign,
	eachArray,
	hasLength,
	hasValue,
	isArray,
	isBuffer,
	isString,
	isTrue,
	isUndefined,
	noValue
} from '@universalweb/acid';
import { decode, encode, } from '#utilities/serialize';
import { toBase64, toHex } from '#utilities/cryptography/utils';
import { createClient } from '../server/clients/index.js';
import { introHeaderRPC } from '#udsp/rpc/headerRPC';
import { maxDefaultPacketSize } from '../utilities/calculatePacketOverhead.js';
/**
	* @TODO
	* - Support other typed arrays not just buffers
	* - Add support to block connection Ids invalid format
 */
export async function decodePacketHeaders(config) {
	const {
		source,
		destination,
		packet: packetEncoded
	} = config;
	const {
		cipher,
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		boxCryptography,
		connectionIdSize
	} = destination;
	const packetSize = packetEncoded.length;
	if (packetSize > maxDefaultPacketSize) {
		destination.logInfo(packetEncoded);
		destination.logInfo(`WARNING: DECODE Packet size is larger than max allowed size ${maxDefaultPacketSize} -> ${packetSize} over by ${packetSize - maxDefaultPacketSize}`);
	}
	const client = config.client;
	destination.logInfo(`Packet Encoded Size ${packetSize}`);
	const packet = await decode(packetEncoded);
	if (isUndefined(packet)) {
		destination.logError('Packet decode failed', packet);
		// TODO: Add support to block connection Ids and or IPs
		return;
	}
	config.packet = packet;
	destination.logInfo(`Packet Decoded Array Size ${packet.length}`);
	destination.logInfo(packet);
	const isShortHeaderMode = isBuffer(packet);
	config.isShortHeaderMode = isShortHeaderMode;
	config.packetDecoded = {};
	let headerEncoded;
	if (isShortHeaderMode) {
		destination.logInfo(`ShortHeaderMode Size ${packet.length}`);
		headerEncoded = packet.subarray(0, connectionIdSize);
	} else {
		headerEncoded = packet[0];
		if (!packet[1]) {
			config.packetDecoded.noMessage = true;
		}
	}
	destination.logInfo(`headerEncoded Size ${headerEncoded.length}`);
	if (!headerEncoded) {
		return console.trace(`No header encoded -> Invalid Packet`);
	}
	config.headerEncoded = headerEncoded;
	// Add single header support which holds only the binary data of the packet.id
	const headerDecoded = headerEncoded;
	if (isUndefined(headerDecoded)) {
		return console.trace(`No header from decode -> Invalid Packet`);
	}
	const id = isShortHeaderMode ? headerDecoded : headerDecoded[0];
	config.packetDecoded.header = headerEncoded;
	config.packetDecoded.id = id;
	if (!isShortHeaderMode) {
		const headerRPC = headerDecoded[1];
		if (hasValue(headerRPC)) {
			config.packetDecoded.headerRPC = headerRPC;
		}
	}
	destination.logInfo(`Decode packet with id: ${id?.toString('hex')}`);
	destination.logInfo(`ShortHeaderMode ${isShortHeaderMode}`);
	return config;
}
export async function decodePacket(config) {
	const {
		source,
		destination,
		packet,
		packetDecoded,
		packetDecoded: { header, },
		headerEncoded,
		isShortHeaderMode,
	} = config;
	const {
		cipher,
		connectionIdSize,
	} = destination;
	let messageEncoded;
	if (isShortHeaderMode) {
		messageEncoded = packet.subarray(connectionIdSize);
	} else {
		messageEncoded = packet[1];
	}
	if (noValue(messageEncoded)) {
		destination.logInfo('No message encoded');
		return true;
	}
	const receiveKey = destination?.receiveKey;
	// TODO: Add support for a shared generic like a TypedArray?
	const hasEncryptedPayload = receiveKey && messageEncoded && isBuffer(messageEncoded) && hasLength(messageEncoded);
	if (hasEncryptedPayload) {
		destination.logInfo(`Receive Key ${toHex(receiveKey)}`);
		destination.logInfo(packet, packetDecoded);
		destination.logInfo(`encrypted Message size ${messageEncoded.length}bytes`);
		const ad = isShortHeaderMode ? headerEncoded : await encode(headerEncoded);
		destination.logInfo('decrypt op', messageEncoded, receiveKey, ad);
		const decryptedMessage = await cipher.decrypt(messageEncoded, receiveKey, ad);
		if (isUndefined(decryptedMessage)) {
			console.trace('Decryption failed');
			return;
		}
		destination.logInfo(`decrypted Message size ${decryptedMessage.length} BYTES`);
		const message = await decode(decryptedMessage);
		if (isUndefined(message)) {
			console.trace('Message Decrypt or Decode failed');
		}
		packetDecoded.message = message;
	} else {
		destination.logInfo(`No Message in Packet`);
	}
	return true;
}
