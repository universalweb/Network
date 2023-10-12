import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from '#utilities/serialize';
import {
	assign, isBuffer, isArray, isTrue, isUndefined, isString, hasValue, eachArray
} from '@universalweb/acid';
import { toBase64 } from '#crypto';
import { createClient } from '../server/clients/index.js';
function headerArray(item, index) {
	const header = this;
	if (isArray(item)) {
		header[item[0]] = item[1];
	} else if (index === 0) {
		header.id = item;
	} else if (index === 1) {
		header.key = item;
	}
}
export async function decodePacketHeaders(config) {
	const {
		source,
		destination,
		packet: packetEncoded
	} = config;
	const {
		encryptionKeypair,
		connectionIdKeypair,
		publicKeyCryptography,
		cipherSuite,
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		boxCryptography,
		encryptClientKey
	} = destination;
	const packetSize = packetEncoded.length;
	if (packetSize > 1280) {
		console.log(packetEncoded);
		failed(`WARNING: DECODE Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	const client = config.client;
	info(`Packet Encoded Size ${packetSize}`);
	const packet = decode(packetEncoded);
	config.packet = packet;
	info(`Packet Decoded Array Size ${packet.length}`);
	console.log(packet);
	const isShortHeaderMode = isBuffer(packet);
	if (isShortHeaderMode) {
		info(`isShortHeaderMode Size ${packet.length}`);
	}
	let headerEncoded;
	if (isShortHeaderMode) {
		config.isShortHeaderMode = true;
		headerEncoded = packet.subarray(0, 8);
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
	if (!headerDecoded) {
		return console.trace(`No header from decode -> Invalid Packet`);
	}
	let header = headerDecoded;
	if (isBuffer(headerDecoded)) {
		header = {
			id: headerDecoded
		};
	} else if (isArray(headerDecoded)) {
		header = {};
		if (headerDecoded.length <= 2) {
			header.id = headerDecoded[0];
			if (headerDecoded[1]) {
				header.id = headerDecoded[1];
			}
		} else {
			eachArray(headerDecoded, headerArray, header);
		}
	}
	if (!header.id) {
		return failed(`No connection id in header -> Invalid Packet`);
	}
	if (connectionIdKeypair) {
		success('Connection ID Decrypted');
		// console.log(destination);
		if (isServerEnd) {
			if (source.encryptConnectionId) {
				header.id = boxCryptography.boxUnseal(header.id, destination.connectionIdKeypair);
			}
		} else if (source.encryptServerConnectionId) {
			header.id = boxCryptography.boxUnseal(header.id, destination.connectionIdKeypair);
		}
		if (!header.id) {
			return console.trace(`Packet ID Decrypt Failed`);
		}
	}
	info(`clientId: ${toBase64(header.id)}`);
	if (header.key) {
		success(`Public Key is given -> Processing as create client`);
		if (encryptionKeypair) {
			if (encryptClientKey) {
				console.log('Decrypting Public Key in UDSP Header');
				const { key } = header;
				header.key = boxCryptography.boxUnseal(key, encryptionKeypair);
				if (!header.key) {
					return failed('Client Key Decode Failed', toBase64(key));
				}
			}
		}
		console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(header.key));
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
		packetDecoded: { header, },
		headerEncoded,
		isShortHeaderMode,
	} = config;
	const { cipherSuite, } = destination;
	let footer;
	let footerEncoded;
	let messageEncoded;
	if (isShortHeaderMode) {
		messageEncoded = packet.subarray(8);
	} else {
		footerEncoded = packet[2];
		messageEncoded = packet[1];
	}
	if (header.error) {
		console.log('Critical Error', header.error);
		// can be returned if a server so chooses to respond to bad/mal/incorrect requests
		// can return unencrypted data
		if (messageEncoded) {
			packetDecoded.message = decode(messageEncoded);
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
		if (!decryptedMessage) {
			return failed('Encryption failed');
		}
		info(`decrypted Message size ${decryptedMessage.length}bytes`);
		const message = decode(decryptedMessage);
		if (!hasValue(message)) {
			return failed('No Message -> Invalid Packet');
		}
		if (message.head) {
			console.log('head PAYLOAD', message.head);
		}
		if (message.data) {
			success('data PAYLOAD', message.data?.length || message.data);
		}
		const frame = message?.frame;
		if (hasValue(frame)) {
			let streamId;
			let packetId;
			let offset;
			if (isArray(frame)) {
				[streamId, packetId, offset] = message.frame;
			} else {
				streamId = frame;
			}
			if (!hasValue(streamId)) {
				return failed('No streamId in message -> Invalid Packet');
			}
			message.id = streamId;
			if (hasValue(packetId)) {
				message.packetId = packetId;
			}
			if (hasValue(offset)) {
				message.offset = offset;
			}
		}
		packetDecoded.message = message;
		if (footerEncoded) {
			footer = footerEncoded && decode(footerEncoded);
			if (!footer) {
				return failed(`Footer failed to decode -> Invalid Packet`);
			} else if (footer) {
				packetDecoded.footer = footer;
			}
		}
	} else {
		failed(`No Encrypted Message - failed to decode -> Invalid Packet`);
	}
	return true;
}
