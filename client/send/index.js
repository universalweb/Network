module.exports = (udspPrototype) => {
	const {
		logImprt,
		error: logError,
		cnsl,
		success,
		utility: {
			promise,
		},
		crypto: {
			encrypt,
			nonceBox,
			toBase64
		},
		buildPacketSize,
		buildStringSize,
		error: errorLog,
		logSent,
		encode
	} = udspPrototype;
	logImprt('Send', __dirname);
	// StreamID, nonce, encrypted message size, flags, packet size.
	async function send(messageOriginal) {
		const stream = this;
		const {
			server,
			configuration: {
				ip,
				port
			}
		} = stream;
		cnsl(`Send to server`);
		if (!messageOriginal && !messageOriginal.length) {
			return logError('Message is empty and will not be sent.');
		}
		const additionalData = {};
		const stateCode = stream.status.code;
		console.log(messageOriginal);
		const messageEncoded = encode(messageOriginal);
		const nonce = nonceBox();
		success(`Nonce Size: ${nonce.length} ${toBase64(nonce)}`);
		additionalData.id = stream.streamId;
		additionalData.nonce = nonce;
		if (stateCode === 0) {
			additionalData.cert = stream.ephemeralPublic;
		}
		const additionalDataEncoded = encode(additionalData);
		const additionalDataEndIndex = additionalDataEncoded.length + 3;
		const additionalDataEndIndexBuffer = buildStringSize(additionalDataEndIndex);
		console.log(additionalDataEndIndex, additionalData);
		const additionalDataCompiled = Buffer.concat([additionalDataEndIndexBuffer, additionalDataEncoded]);
		success(`Additional Data End Index ${additionalDataEndIndex.toString()}`);
		console.log(stream.transmitKey.toString('base64'));
		const encryptedMessage = encrypt(messageEncoded, additionalDataEncoded, nonce, stream.transmitKey);
		if (!encryptedMessage) {
			return errorLog('Encryption failed');
		}
		success(`Encrypted Message Size:${encryptedMessage.length} -> ${toBase64(encryptedMessage)}`);
		const encryptedLength = encryptedMessage.length;
		const encryptedDataEndIndex = buildPacketSize(additionalDataEndIndex + 4 + encryptedLength);
		success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
		const messageBuffer = Buffer.concat([
			additionalDataCompiled,
			encryptedDataEndIndex,
			encryptedMessage,
		]);
		console.log(encryptedMessage.toString('base64'));
		const packetSize = messageBuffer.length;
		success(`Packet End Index ${packetSize}`);
		success('Message Buffer Size', Buffer.from(messageBuffer).length);
		if (packetSize >= 1280) {
			errorLog(`WARNING: Packet size is larger than max allowed size -> ${packetSize}`);
		}
		return promise((accept, reject) => {
			server.send(messageBuffer, port, ip, (error) => {
				if (error) {
					logError(error);
					return reject(error);
				}
				logSent(messageBuffer);
				accept();
			});
		});
	}
	udspPrototype.send = send;
};
