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
export async function createPacket(message, source, destination, headers, footer) {
	success(`PROCESSING TO ENCODE PACKET`);
	const {
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient,
		cipher,
		nonce
	} = source;
	const id = destination.id;
	if (!hasValue(id)) {
		console.trace(`ID is missing`);
		return;
	}
	let shortHeaderMode = true;
	if (headers) {
		headers[0] = id;
		shortHeaderMode = false;
		this.logInfo('HEADERS GIVEN');
	}
	const header = headers || id;
	if (isClient) {
		info(`Encode client Packet with cid: ${id.toString('hex')}`);
	} else {
		info(`Decode Server Packet with cid: ${id.toString('hex')}`);
	}
	const headerEncoded = shortHeaderMode ? header : encode(header);
	const transmitKey = source?.transmitKey;
	let packetEncoded;
	if (message && transmitKey) {
		info(`Transmit Key ${toBase64(transmitKey)}`);
		const messageEncoded = encode(message);
		const ad = headerEncoded;
		const encryptedMessage = await cipher.encrypt(messageEncoded, transmitKey, ad, nonce);
		this.logInfo('nonce used', nonce);
		if (!encryptedMessage) {
			this.logInfo('Encryption failed');
			return;
		}
		const packetStructure = [header, encryptedMessage];
		if (shortHeaderMode) {
			return encode(Buffer.concat(packetStructure));
		}
		return encode(packetStructure);
	}
	this.logInfo('No message given header only packet');
	return encode([header]);
}
export async function encodePacket(message, source, destination, headers, footer) {
	const encodedPacket = await createPacket(message, source, destination, headers, footer);
	if (!encodedPacket) {
		this.logInfo(`Failed to encode packet`);
		return;
	}
	const packetSize = encodedPacket.length;
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize > maxDefaultPacketSize) {
		console.trace(`WARNING: Encode Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - maxDefaultPacketSize}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return encodedPacket;
}
