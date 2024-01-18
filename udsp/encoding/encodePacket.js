import {
	assign,
	chunk,
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
		publicKeyCryptography,
		cipherSuite,
		boxCryptography
	} = source;
	let id = destination.id || source.id;
	if (!id) {
		console.trace(`ID is missing`);
		return;
	}
	const shouldEncryptConnectionId = isServerEnd ? source.encryptClientConnectionId : source.encryptServerConnectionId;
	if (shouldEncryptConnectionId) {
		id = boxCryptography.boxSeal(id, destination.connectionIdKeypair);
		if (!id) {
			console.trace(`Connection failed to encrypt`);
			return;
		}
	}
	let header = id;
	let shortHeaderMode = true;
	if (headers) {
		const isHeadersAnArray = isArray(headers) && (headers.length > 0);
		shortHeaderMode = false;
		if (isHeadersAnArray) {
			headers.unshift(id);
			header = headers;
		} else {
			header = [
				id,
				headers
			];
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
	if (message && source.sessionKeys && source.sessionKeys?.transmitKey) {
		info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
		const messageEncoded = encode(message);
		const ad = headerEncoded;
		const encryptedMessage = cipherSuite.encrypt(messageEncoded, source.sessionKeys, ad);
		if (!encryptedMessage) {
			return console.trace('Encryption failed');
		}
		let packetStructure = [
			header,
			encryptedMessage
		];
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
