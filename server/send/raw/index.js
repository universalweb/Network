module.exports = (server) => {
	const {
		server: rawServer,
		logImprt,
		error: errorLog,
		logSent,
		utility: {
			promise,
		},
		encode,
		crypto: {
			encrypt,
			randombytes_buf,
			toBase64
		},
		success,
		buildPacketSize,
		buildStringSize,
	} = server;
	logImprt('Send', __dirname);
	// clientId, nonce, encrypted message size, flags, packet size.
	async function sendRaw(rawMessage, address, port, nonce, transmitKey, clientId) {
		success(`SENDING MESSAGE`);
		success(`clientId: ${toBase64(clientId)}`);
		success(`Transmit Key ${toBase64(transmitKey)}`);
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
			return errorLog('Encryption failed');
		}
		success(`Encrypted Message: Size:${encryptedMessage.length} ${toBase64(encryptedMessage)}`);
		const encryptedDataEndIndex = buildPacketSize(headersEndIndex + 4 + encryptedLength);
		success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
		const sendBuffer = [
			headersCompiled,
			encryptedDataEndIndex,
			encryptedMessage,
		];
		logSent(toBase64(sendBuffer), `Size:${sendBuffer.length}`);
		return promise((accept, reject) => {
			rawServer.send(sendBuffer, port, address, (error) => {
				if (error) {
					reject(error);
					return errorLog(error);
				}
				success('Message Sent');
				accept();
			});
		});
	}
	server.sendRaw = sendRaw;
};
