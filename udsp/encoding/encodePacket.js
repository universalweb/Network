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
} from '#utilities/serialize';
import {
	assign,
	chunk,
	omit,
	objectSize,
	isPlainObject,
	isArray
} from '@universalweb/acid';
import { toBase64 } from '#crypto';
/**
 * @todo
	 * Set Smart Id Routing up
	 * Set up short headers with array of headers key then id alone in array applicable at startup only
	 * Allow complex headers being objects long header mode
	 * Way for packet to be as a whole buffer First check the first 8 bytes for connection id if not then parse whole packet.
 */
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
	let header = id;
	let shortHeaderMode = true;
	if (headers) {
		const isHeadersAnObject = isPlainObject(headers);
		const isHeadersAnArray = isArray(headers);
		header = headers;
		shortHeaderMode = false;
		if (isHeadersAnArray && headers.length) {
			header.unshift(id);
		} else if (isHeadersAnObject && objectSize(headers)) {
			header.id = id;
		} else {
			header = id;
			shortHeaderMode = true;
		}
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
	const headerEncoded = (shortHeaderMode) ? header : encode(header);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headerEncoded, footer]) : headerEncoded;
	const encryptedMessage = cipherSuite.encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	let packetStructure = [headerEncoded, encryptedMessage];
	if (shortHeaderMode) {
		packetStructure = Buffer.concat(packetStructure);
	} else if (footer) {
		packetStructure[2] = encode(footer);
	}
	const packetEncoded = encode(packetStructure);
	const packetSize = packetEncoded.length;
	console.log('Size Unencrypted', encode([headerEncoded, messageEncoded]).length);
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize > 1280) {
		console.log(packetEncoded);
		failed(`WARNING: Encode Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packetEncoded;
}
