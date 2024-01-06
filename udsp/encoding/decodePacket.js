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
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { createClient } from '../server/clients/index.js';
import { toBase64 } from '#crypto';
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
	config.isShortHeaderMode = isShortHeaderMode;
	if (isShortHeaderMode) {
		info(`ShortHeaderMode Size ${packet.length}`);
	}
	let headerEncoded;
	if (isShortHeaderMode) {
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
	const headerDecoded = headerEncoded;
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
		console.log(`Decode destination ID: ${destination.id.toString('hex')}`);
		console.log(`Decode source ID: ${source?.id?.toString('hex')}`);
	} else {
		console.log(`Decode Server side packet with id: ${id.toString('hex')}`);
	}
	config.packetDecoded = {
		header: headerDecoded,
		id
	};
	if (!isShortHeaderMode) {
		const headerRPC = headerDecoded[1];
		if (headerRPC) {
			config.packetDecoded.headerRPC = headerRPC;
		}
		if (headerRPC === 0) {
			success(`Public Key is given -> Processing as create client`);
			const key = headerDecoded[2];
			if (!key) {
				return console.trace('No Client Key provided', headerDecoded);
			}
			config.packetDecoded.key = key;
			// Add check for length of key before processing further and just kill the connection
			if (encryptionKeypair) {
				if (connectionIdKeypair) {
					console.log('Decrypting Public Key in UDSP Header');
					const decryptedKey = boxCryptography.boxUnseal(key, encryptionKeypair);
					if (decryptedKey) {
						headerDecoded[2] = decryptedKey;
						config.packetDecoded.key = decryptedKey;
						console.log('DESTINATION DECRYPT PUBLIC KEY', toBase64(key));
					} else {
						return console.trace('Client Key Decode Failed', toBase64(key));
					}
				}
			}
		}
	}
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
		connectionIdSize,
		sessionKeys
	} = destination;
	let messageEncoded;
	if (isShortHeaderMode) {
		messageEncoded = packet.subarray(connectionIdSize);
	} else {
		messageEncoded = packet[1];
	}
	if (noValue(messageEncoded)) {
		console.log('No message encoded');
		return true;
	}
	// console.log(destination);
	info(`Receive Key ${toBase64(sessionKeys.receiveKey)}`);
	if (messageEncoded && isBuffer(messageEncoded) && hasLength(messageEncoded)) {
		console.log(packet, packetDecoded);
		if (sessionKeys) {
			info(`encrypted Message size ${messageEncoded.length}bytes`);
			console.log('cipherSuite', cipherSuite);
			const ad = (isShortHeaderMode) ? headerEncoded : encode(headerEncoded);
			const decryptedMessage = cipherSuite.decrypt(messageEncoded, sessionKeys, ad);
			if (isUndefined(decryptedMessage)) {
				console.trace('Encryption failed');
				return;
			}
			info(`decrypted Message size ${decryptedMessage.length} BYTES`);
			const message = decode(decryptedMessage);
			if (isUndefined(message)) {
				console.trace('No Message in Packet');
			}
			packetDecoded.message = message;
		}
	} else {
		console.trace(`No Message in Packet`);
	}
	return true;
}
