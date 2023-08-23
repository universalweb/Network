import {
	success,
	failed,
	imported,
	msgSent,
	info
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import {
	assign,
	chunk,
	omit,
	objectSize
} from '@universalweb/acid';
import { toBase64 } from '#crypto';
export async function encodePacket(message, source, destination, headers, footer) {
	success(`PROCESSING TO ENCODE PACKET`);
	const {
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		publicKeyCryptography,
		cipherSuite,
		boxCryptography
	} = source;
	let id = destination.id || source.id;
	if (!id) {
		return console.error(`ID IS'T ASSIGNED`);
	}
	if (isServerEnd) {
		if (source.encryptConnectionId) {
			id = boxCryptography.boxSeal(id, destination.connectionIdKeypair);
		}
	} else if (source.encryptServerConnectionId) {
		id = boxCryptography.boxSeal(id, destination.connectionIdKeypair);
	}
	if (!id) {
		return console.error(`Connection ID missing`);
	}
	let header;
	if (headers && objectSize(headers)) {
		header = headers;
		header.id = id;
	} else {
		header = id;
	}
	if (message) {
		console.log(message);
		if (message?.frame?.length === 1) {
			message.frame = message.frame[0];
		}
	}
	if (headers) {
		console.log(headers);
	}
	info(`clientId: ${toBase64(id)}`);
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	message.t = Date.now();
	const headerEncoded = encode(header);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headerEncoded, footer]) : headerEncoded;
	const encryptedMessage = cipherSuite.encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packetStructure = [headerEncoded, encryptedMessage];
	if (footer) {
		packetStructure[2] = encode(footer);
	}
	const packetEncoded = encode(packetStructure);
	const packetSize = packetEncoded.length;
	console.log('Size Unencrypted', encode([headerEncoded, messageEncoded]).length);
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize > 1280) {
		console.log(packetEncoded);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packetEncoded;
}
