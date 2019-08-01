module.exports = async (state) => {
	await require('./buildPacketSize')(state);
	await require('./buildStringSize')(state);
	const {
		server,
		logImprt,
		error: logError,
		cnsl,
		success,
		utility: {
			promise,
		},
		configuration: {
			ip,
			port
		},
		crypto: {
			encrypt,
			nonceBox,
			createStreamId,
			toBase64
		},
		profiles,
		buildPacketSize,
		buildStringSize,
		error: errorLog,
		logSent,
		sessionKeys: {
			transmitKey,
			receiveKey
		},
		stringify
	} = state;
	logImprt('Send', __dirname);
	const streamId = createStreamId();
	state.streamId = streamId;
	success(`StreamID: ${toBase64(streamId)}`);
	success(`Transmit Key ${toBase64(transmitKey)}`);
	success(`Receive Key ${toBase64(receiveKey)}`);
	// StreamID, nonce, encrypted message size, flags, packet size.
	const packetDefaultsLength = 8 + 24 + 4 + 2 + 4;
	const offFlag = Buffer.from('0');
	const onFlag = Buffer.from('1');
	async function send(messageOriginal) {
		cnsl(`Send to server`);
		if (!messageOriginal && !messageOriginal.length) {
			return logError('Message is empty and will not be sent.');
		}
		const stateCode = state.status.code;
		const json = stringify(messageOriginal);
		success(`Message:`, messageOriginal);
		const jsonBuffer = Buffer.from(json);
		const nonce = nonceBox();
		success(`Nonce Size: ${nonce.length} ${toBase64(nonce)}`);
		let messageBuffer;
		let packetSize;
		if (stateCode === 0) {
			const ephemeralCertificate = Buffer.from(profiles.active.ephemeralString);
			const ephemeralCertificateLength = ephemeralCertificate.length;
			const ephemeralCertificateSize = buildStringSize(ephemeralCertificateLength);
			success(`Ephemeral Certificate Size Flag: ${ephemeralCertificateSize.toString()}`);
			success(`Ephemeral Certificate:`, profiles.active.ephemeralString);
			const ad = [
				offFlag,
				onFlag,
				ephemeralCertificateSize,
				ephemeralCertificate,
				streamId,
				nonce,
			];
			const additionalDataBuffer = Buffer.concat(ad);
			success('Additional Data Buffer', additionalDataBuffer.toString('base64'));
			const encryptedMessage = encrypt(jsonBuffer, additionalDataBuffer, nonce, transmitKey);
			if (!encryptedMessage) {
				return errorLog('Encryption failed');
			}
			success(`Encrypted Message: Size:${encryptedMessage.length} ${toBase64(encryptedMessage)}`);
			const encryptedLength = encryptedMessage.length;
			const encryptedSizePacket = buildPacketSize(encryptedLength);
			success(`Packet Size Flag: ${encryptedSizePacket.toString()}`);
			messageBuffer = [
				...ad,
				encryptedSizePacket,
				encryptedMessage,
			];
			packetSize = encryptedLength + packetDefaultsLength + ephemeralCertificateLength + 3;
		} else {
			success('Normal Message');
			const ad = [
				offFlag,
				offFlag,
				streamId,
				nonce,
			];
			const additionalDataBuffer = Buffer.concat(ad);
			success('Additional Data Buffer', additionalDataBuffer.toString('base64'));
			const encryptedMessage = encrypt(jsonBuffer, additionalDataBuffer, nonce, transmitKey);
			if (!encryptedMessage) {
				return errorLog('Encryption failed');
			}
			success(`Encrypted Message: Size:${encryptedMessage.length} ${toBase64(encryptedMessage)}`);
			const encryptedLength = encryptedMessage.length;
			const encryptedSizePacket = buildPacketSize(encryptedLength);
			success(`Packet Size Flag: ${encryptedSizePacket.toString()}`);
			messageBuffer = [
				...ad,
				encryptedSizePacket,
				encryptedMessage,
			];
			packetSize = encryptedLength + packetDefaultsLength + 3;
		}
		messageBuffer.unshift(buildPacketSize(packetSize));
		success(`Packet Size ${packetSize}`);
		success('Message Buffer Size', Buffer.from(messageBuffer).length);
		if (packetSize >= 1280) {
			errorLog(`Packet size is too large ${packetSize}`);
		}
		return promise((accept, reject) => {
			server.send(messageBuffer, port, ip, (error) => {
				if (error) {
					logError(error);
					return reject(error);
				}
				logSent(messageBuffer.toString('base64'));
				cnsl(`Size:${packetSize}`);
				accept();
			});
		});
	}
	state.send = send;
	await require('./request')(state);
};
