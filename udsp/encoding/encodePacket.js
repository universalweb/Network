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
	const shouldEncryptConnectionId = (isServerEnd) ? source.encryptClientConnectionId : source.encryptServerConnectionId;
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
		const isHeadersAnArray = isArray(headers) && headers.length > 0;
		shortHeaderMode = false;
		if (isHeadersAnArray) {
			headers.unshift(id);
			header = headers;
		} else {
			header = [id, headers];
		}
		console.log('HEADERS GIVEN', isHeadersAnArray, headers);
	}
	if (message) {
		console.log(message);
	}
	if (isClient) {
		info(`Encode client side with id: ${id.toString('hex')}`);
	} else {
		info(`Decode Server side with Server-Client-id: ${id.toString('hex')}`);
	}
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	const headerEncoded = (shortHeaderMode) ? header : encode(header);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headerEncoded, footer]) : headerEncoded;
	const encryptedMessage = cipherSuite.encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return console.trace('Encryption failed');
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
		console.trace(`WARNING: Encode Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packetEncoded;
}
