module.exports = (state) => {
	const {
		error: logError,
		success,
		parseMessage,
		crypto: {
			decrypt,
		},
		api: {
			onMessage
		},
		logReceived,
		streams,
	} = state;
	let count = 0;
	async function processMessage(connection, additionalDataBuffer, additionalData, packet) {
		const streamID = additionalData.id;
		const stream = streams.get(streamID.toString('base64'));
		if (!stream) {
			return false;
		}
		const nonce = additionalData.nonce;
		const decrypted = decrypt(packet, additionalDataBuffer, nonce, stream.receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		const message = parseMessage(decrypted);
		if (!message) {
			return logError('JSON ERROR', connection);
		}
		logReceived(message);
		count++;
		await onMessage(stream, message);
		success(`Messages Received: ${count}`);
	}
	state.processMessage = processMessage;
};
