import {
	success, failed, imported, msgSent, info
} from '../utilities/logs.js';
import { buildPacketSize } from '../utilities/buildPacketSize.js';
import { buildStringSize } from '../utilities/buildStringSize.js';
import {
	encode,
	decode
} from 'msgpackr';
import { promise } from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign,
	randombytes_buf
} from '../utilities/crypto.js';
// clientId, nonce, encrypted message size, flags, packet size.
export async function sendPacket(rawMessage, address, port, nonce, transmitKey, clientId) {
	success(`SENDING MESSAGE`);
	success(`clientId: ${toBase64(clientId)}`);
	success(`Transmit Key ${toBase64(transmitKey)}`);
	const thisContext = this;
	rawMessage.time = Date.now();
	console.log('FULL MESSAGE', rawMessage);
	const message = encode(rawMessage);
	randombytes_buf(nonce);
	success(`Nonce ${toBase64(nonce)} Size: ${nonce.length}`);
	const headers = {
		id: clientId,
		nonce,
	};
	const headersEncoded = encode(headers);
	const headersEndIndex = headersEncoded.length + 3;
	const headersEndIndexBuffer = buildStringSize(headersEndIndex);
	const headersCompiled = Buffer.concat([headersEndIndexBuffer, headersEncoded]);
	success('Additional Data Buffer');
	console.log(headersEndIndex, headers);
	const encryptedMessage = encrypt(message, headersEncoded, nonce, transmitKey);
	const encryptedLength = encryptedMessage.length;
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	success(`Encrypted Message: Size:${encryptedMessage.length} ${toBase64(encryptedMessage)}`);
	const encryptedDataEndIndex = buildPacketSize(headersEndIndex + 4 + encryptedLength);
	success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
	const sendBuffer = [
		headersCompiled,
		encryptedDataEndIndex,
		encryptedMessage,
	];
	msgSent(toBase64(sendBuffer), `Size:${sendBuffer.length}`);
	return promise((accept, reject) => {
		thisContext.server.send(sendBuffer, port, address, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			success('Message Sent');
			accept();
		});
	});
}
