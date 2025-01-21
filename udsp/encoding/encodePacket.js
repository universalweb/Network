import {
	assign,
	chunk,
	hasValue,
	isArray,
	isPlainObject,
	objectSize,
	omit
} from '@universalweb/acid';
import {
	decode,
	encode
} from '#utilities/serialize';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { maxDefaultPacketSize } from '../calculatePacketOverhead.js';
import { toBase64 } from '#crypto';
/**
 * @todo
 * - Set Smart Id Routing up.
 * - If the packet is a request, then it should be sent to the server.
 */
// [id, RPC, ...Args]
export async function encodePacket(message = Buffer.from(0), source, destination, headers, footer) {
	success(`PROCESSING TO ENCODE PACKET`);
	const {
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		cipherSuite
	} = source;
	const id = destination.id;
	if (!hasValue(id)) {
		console.trace(`ID is missing`);
		return;
	}
	let header = id;
	let shortHeaderMode = true;
	if (headers) {
		const isHeadersAnArray = isArray(headers);
		if (isHeadersAnArray) {
			if (headers.length > 0) {
				headers.unshift(id);
				header = headers;
			}
		} else {
			header = [id, headers];
		}
		if (isArray(header)) {
			shortHeaderMode = false;
		}
		console.log('HEADERS GIVEN', isHeadersAnArray, headers);
	}
	if (isClient) {
		info(`Encode client side with id: ${id.toString('hex')}`);
	} else {
		info(`Decode Server side with Server-Client-id: ${id.toString('hex')}`);
	}
	const headerEncoded = shortHeaderMode ? header : encode(header);
	let packetEncoded;
	const transmitKey = source?.transmitKey;
	if (message && transmitKey) {
		info(`Transmit Key ${toBase64(transmitKey)}`);
		const messageEncoded = encode(message);
		const ad = headerEncoded;
		console.log(cipherSuite);
		const encryptedMessage = await cipherSuite.encrypt(messageEncoded, transmitKey, ad);
		if (!encryptedMessage) {
			return console.trace('Encryption failed');
		}
		let packetStructure = [header, encryptedMessage];
		if (shortHeaderMode) {
			packetStructure = Buffer.concat(packetStructure);
		}
		packetEncoded = encode(packetStructure);
	} else {
		packetEncoded = encode([header]);
		console.log('No message given sending as header only');
	}
	const packetSize = packetEncoded.length;
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize > 1280) {
		console.log(packetEncoded);
		console.trace(`WARNING: Encode Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - maxDefaultPacketSize}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packetEncoded;
}
