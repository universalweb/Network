module.exports = async (state) => {
	require('./parseMessage')(state);
	require('./send')(state);
	require('./emit')(state);
	await require('./stream')(state);
	require('./createStreamMessage')(state);
	require('./processMessage')(state);
	const {
		logImprt,
		success,
		server,
		createStreamMessage,
		processMessage,
		logReceived,
		error: logError,
		decode,
	} = state;
	logImprt('Server onMessage', __dirname);
	async function onMessage(messageBuffer, connection) {
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
		const {
			cert
		} = additionalData;
		if (cert && cert.key) {
			success(`Public Key is given -> Processing handshake`);
			await createStreamMessage(connection, additionalDataBuffer, additionalData, packet);
		} else {
			success(`No Public Key is given`);
			await processMessage(connection, additionalDataBuffer, additionalData, packet);
		}
	}
	server.on('message', onMessage);
};
