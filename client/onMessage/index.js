module.exports = (udspPrototype) => {
	const {
		logImprt,
		success,
		decode,
		error: logError,
		crypto: {
			decrypt
		},
		logReceived
	} = udspPrototype;
	logImprt('Server onMessage', __dirname);
	async function onMessage(messageBuffer, connection) {
		const stream = this;
		const {
			receiveKey,
		} = stream;
		logReceived('Message Received');
		const additionalDataEndIndex = Number(messageBuffer.slice(0, 3));
		if (!additionalDataEndIndex) {
			return logError(`No additionalData size number -> Invalid Packet`);
		}
		success(`Additional Data size ${additionalDataEndIndex - 3}`);
		const additionalDataBuffer = messageBuffer.slice(3, additionalDataEndIndex);
		const additionalData = decode(additionalDataBuffer);
		if (!additionalData) {
			return logError(`No additionalData -> Invalid Packet`);
		}
		success(`Additional Data`);
		console.log(additionalData);
		const packetEndIndex = Number(messageBuffer.slice(additionalDataEndIndex, additionalDataEndIndex + 4));
		if (!packetEndIndex) {
			return logError(`No packet size number -> Invalid Packet`);
		}
		success(`Packet size ${packetEndIndex}`);
		console.log(additionalDataEndIndex + 4, packetEndIndex);
		const packet = messageBuffer.slice(additionalDataEndIndex + 4, packetEndIndex);
		if (!packet) {
			return logError(`No packet -> Invalid Packet`);
		}
		success(`Packet`);
		console.log(packet);
		const nonce = additionalData.nonce;
		const decrypted = decrypt(packet, additionalDataBuffer, nonce, receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		const message = decode(decrypted);
		console.log(message);
		stream.processMessage(message, decrypted, connection);
	}
	udspPrototype.onMessage = onMessage;
};
