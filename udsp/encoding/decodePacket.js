import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from '#utilities/serialize';
import {
	assign, isBuffer, isArray, isTrue, isUndefined, isString, hasValue, eachArray
} from '@universalweb/acid';
import { toBase64 } from '#crypto';
import { createClient } from '../server/clients/index.js';
/**
	* @TODO
	* Add support to block connection Ids that are too large
	* Add support to block connection Ids that are too small
 */
export async function decodePacketHeaders(config) {
	const {
		source,
		destination,
		packet: packetEncoded
	} = config;
	const {
		encryptionKeypair,
		publicKeyCryptography,
		cipherSuite,
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		boxCryptography,
		connectionIdKeypair,
		connectionIdSize
	} = destination;
	const packetSize = packetEncoded.length;
	if (packetSize > 1280) {
		console.log(packetEncoded);
		console.trace(`WARNING: DECODE Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	const client = config.client;
	info(`Packet Encoded Size ${packetSize}`);
	const packet = decode(packetEncoded);
	if (isUndefined(packet)) {
		console.trace('Packet decode failed');
		return;
	}
	config.packet = packet;
	info(`Packet Decoded Array Size ${packet.length}`);
	console.log(packet);
	const isShortHeaderMode = isBuffer(packet);
	if (isShortHeaderMode) {
		info(`ShortHeaderMode Size ${packet.length}`);
	}
	let headerEncoded;
	if (isShortHeaderMode) {
		config.isShortHeaderMode = true;
		headerEncoded = packet.subarray(0, connectionIdSize);
	} else {
		headerEncoded = packet[0];
	}
	info(`headerEncoded Size ${headerEncoded.length}`);
	if (!headerEncoded) {
		return console.trace(`No header encoded -> Invalid Packet`);
	}
	config.headerEncoded = headerEncoded;
	// Add single header support which holds only the binary data of the packet.id
	const headerDecoded = (isShortHeaderMode) ? headerEncoded : decode(headerEncoded);
	if (isUndefined(headerDecoded)) {
		return console.trace(`No header from decode -> Invalid Packet`);
	}
	let id = (isShortHeaderMode) ? headerDecoded : headerDecoded[0];
	if (connectionIdKeypair) {
		success('Connection ID Decrypted');
		const shouldDecryptConnectionId = (isServerEnd) ? destination.encryptServerConnectionId : destination.encryptClientConnectionId;
		// console.log(destination);
		if (shouldDecryptConnectionId) {
			id = boxCryptography.boxUnseal(id, destination.connectionIdKeypair);
			if (!id) {
				console.trace(`Packet ID Decrypt Failed`);
				return;
			}
		}
	}
	if (isClient) {
		console.log(`Decode client side with id: ${destination.id.toString('hex')}`);
		console.log(`Decode client side with Server-Client-id: ${source?.id?.toString('hex')}`);
	} else {
		console.log(`Decode Server side packet with id: ${id.toString('hex')}`);
	}
	if (!isShortHeaderMode) {
		const headerRPC = headerDecoded[1];
		if (headerRPC) {
			config.headerRPC = headerRPC;
		}
		if (headerRPC === 0) {
			success(`Public Key is given -> Processing as create client`);
			let key = headerDecoded[2];
			if (!key) {
				return console.trace('No Client Key provided', headerDecoded);
			}
			// Add check for length of key before processing further and just kill the connection
			if (encryptionKeypair) {
				if (headerDecoded[2] && connectionIdKeypair) {
					console.log('Decrypting Public Key in UDSP Header');
					key = boxCryptography.boxUnseal(key, encryptionKeypair);
					if (key) {
						headerDecoded[2] = key;
					} else {
						return console.trace('Client Key Decode Failed', toBase64(key));
					}
				}
			}
			console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(key));
		} else {
			success(`Invalid Code given`);
		}
	}
	// console.log(header);
	config.packetDecoded = {
		header: headerDecoded,
		id
	};
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
		cipherSuite,
		connectionIdSize
	} = destination;
	let footer;
	let footerEncoded;
	let messageEncoded;
	if (isShortHeaderMode) {
		messageEncoded = packet.subarray(connectionIdSize);
	} else {
		footerEncoded = packet[2];
		messageEncoded = packet[1];
	}
	if (header.error) {
		console.log('Critical Error', header.error);
		if (messageEncoded) {
			packetDecoded.message = decode(messageEncoded);
			if (isUndefined(packetDecoded.message)) {
				console.trace('Packet message decode failed');
				return;
			}
		}
		return true;
	}
	const ad = (footer) ? Buffer.concat([headerEncoded, footerEncoded]) : headerEncoded;
	// console.log(destination);
	info(`Receive Key ${toBase64(destination.sessionKeys.receiveKey)}`);
	if (messageEncoded) {
		console.log(packet, packetDecoded);
		info(`encrypted Message size ${messageEncoded.length}bytes`);
		console.log('cipherSuite', cipherSuite);
		const decryptedMessage = cipherSuite.decrypt(messageEncoded, destination.sessionKeys, ad);
		if (isUndefined(decryptedMessage)) {
			console.trace('Encryption failed');
			return;
		}
		info(`decrypted Message size ${decryptedMessage.length} BYTES`);
		const message = decode(decryptedMessage);
		if (isUndefined(message)) {
			console.trace('No Message in Packet');
			return;
		}
		packetDecoded.message = message;
		if (footerEncoded) {
			footer = decode(footerEncoded);
			if (isUndefined(footer)) {
				console.trace(`Footer failed to decode -> Invalid Packet`);
				return;
			}
			packetDecoded.footer = footer;
		}
	} else {
		console.trace(`No Encrypted Message - failed to decode -> Invalid Packet`);
	}
	return true;
}
