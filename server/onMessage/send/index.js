module.exports = (state) => {
	const {
		server,
		logImprt,
		error: errorLog,
		logSent,
		utility: {
			promise
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
	} = state;
	logImprt('Send', __dirname);
	// StreamID, nonce, encrypted message size, flags, packet size.
	async function send(messageObject, address, port, nonce, transmitKey, id) {
		success(`SENDING MESSAGE:`, messageObject);
		success(`StreamID: ${id.toString('base64')}`);
		success(`Transmit Key ${toBase64(transmitKey)}`);
		const message = encode(messageObject);
		randombytes_buf(nonce);
		success(`Nonce ${toBase64(nonce)} Size: ${nonce.length}`);
		const additionalData = {
			id,
			nonce,
		};
		const additionalDataEncoded = encode(additionalData);
		const additionalDataEndIndex = additionalDataEncoded.length + 3;
		const additionalDataEndIndexBuffer = buildStringSize(additionalDataEndIndex);
		console.log(additionalDataEndIndex, additionalData);
		const additionalDataCompiled = Buffer.concat([additionalDataEndIndexBuffer, additionalDataEncoded]);
		success('Additional Data Buffer', additionalData);
		const encryptedMessage = encrypt(message, additionalDataEncoded, nonce, transmitKey);
		const encryptedLength = encryptedMessage.length;
		if (!encryptedMessage) {
			return errorLog('Encryption failed');
		}
		success(`Encrypted Message: Size:${encryptedMessage.length} ${encryptedMessage.toString('base64')}`);
		const encryptedDataEndIndex = buildPacketSize(additionalDataEndIndex + 4 + encryptedLength);
		success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
		const sendBuffer = [
			additionalDataCompiled,
			encryptedDataEndIndex,
			encryptedMessage,
		];
		logSent(sendBuffer.toString('base64'), `Size:${sendBuffer.length}`);
		return promise((accept, reject) => {
			server.send(sendBuffer, port, address, (error) => {
				if (error) {
					reject(error);
					return errorLog(error);
				}
				success('Message Sent');
				accept();
			});
		});
	}
	state.send = send;
};
