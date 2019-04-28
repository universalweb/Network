module.exports = async (state) => {
	const {
		error: logError,
		success,
		parseMessage,
		crypto: {
			decrypt,
		},
		private: {
			onMessage
		},
		logReceived,
		pluckBuffer,
		streams,
	} = state;
	let count = 0;
	async function processMessage(connection, packet) {
		const streamIDEndIndex = 2 + 8;
		const streamID = pluckBuffer(packet, 2, streamIDEndIndex, `streamID`, 'base64');
		if (!streamID) {
			return logError('No Stream ID');
		}
		const stream = streams.get(streamID.toString('base64'));
		if (!stream) {
			return logError('No Stream matching ID');
		}
		const nonceEndIndex = streamIDEndIndex + 24;
		const nonce = pluckBuffer(packet, streamIDEndIndex, nonceEndIndex, `nonce`, 'base64');
		if (!nonce) {
			return;
		}
		const encryptedLengthEndIndex = nonceEndIndex + 4;
		success(`encryptedEndIndex: ${encryptedLengthEndIndex}`);
		const encryptedLength = pluckBuffer(packet, nonceEndIndex, encryptedLengthEndIndex, `encrypted`);
		if (!encryptedLength) {
			return;
		}
		const ad = pluckBuffer(packet, 0, nonceEndIndex, `Additional Data`);
		const encryptedEndIndex = Number(encryptedLength.toString()) + encryptedLengthEndIndex;
		const encrypted = pluckBuffer(packet, encryptedLengthEndIndex, encryptedEndIndex, `encrypted Message`, 'base64');
		if (!encrypted) {
			return;
		}
		success(`Encrypted Message Size: ${encrypted.length}`);
		const decrypted = decrypt(encrypted, ad, nonce, stream.receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		success(`Decrypted ${decrypted.toString()}`);
		const jsonString = decrypted.toString();
		if (jsonString) {
			if (jsonString.length > 1100) {
				return logError('Client sent large datagram not allowed');
			}
			const json = parseMessage(jsonString);
			logReceived(json);
			if (!json) {
				return logError('JSON ERROR', connection);
			}
			count++;
			await onMessage(stream, json);
			success(`Messages Received: ${count}`);
		}
	}
	state.processMessage = processMessage;
};
