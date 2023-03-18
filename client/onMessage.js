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
		const socket = this;
		const {
			receiveKey,
		} = socket;
		logReceived('Message Received');
		const headersEndIndex = Number(messageBuffer.slice(0, 3));
		if (!headersEndIndex) {
			return logError(`No headers size number -> Invalid Packet`);
		}
		success(`Additional Data size ${headersEndIndex - 3}`);
		const headersBuffer = messageBuffer.slice(3, headersEndIndex);
		const headers = decode(headersBuffer);
		if (!headers) {
			return logError(`No headers -> Invalid Packet`);
		}
		success(`Additional Data`);
		console.log(headers);
		const packetEndIndex = Number(messageBuffer.slice(headersEndIndex, headersEndIndex + 4));
		if (!packetEndIndex) {
			return logError(`No packet size number -> Invalid Packet`);
		}
		success(`Packet size ${packetEndIndex}`);
		console.log(headersEndIndex + 4, packetEndIndex);
		const packet = messageBuffer.slice(headersEndIndex + 4, packetEndIndex);
		if (!packet) {
			return logError(`No packet -> Invalid Packet`);
		}
		success(`Packet`);
		console.log(packet);
		const nonce = headers.nonce;
		const decrypted = decrypt(packet, headersBuffer, nonce, receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		const message = decode(decrypted);
		console.log(message);
		if (message) {
			if (message.head) {
				message.head = decode(message.head);
			}
			if (message.body) {
				message.body = decode(message.body);
			}
			socket.processMessage(message, headers);
		}
	}
	udspPrototype.onMessage = onMessage;
};
