module.exports = (server) => {
	const {
		logImprt,
		success,
		server: rawServer,
		processSocketCreation,
		processMessage,
		logReceived,
		error: logError,
		decode,
	} = server;
	logImprt('Server onMessage', __dirname);
	async function onMessage(messageBuffer, connection) {
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
		const {
			key,
			sig
		} = headers;
		console.log('Headers', headers);
		if (key && sig) {
			success(`Public Key is given -> Processing handshake`);
			await processSocketCreation(connection, headersBuffer, headers, packet);
		} else {
			success(`No Public Key is given -> Processing as a message`);
			await processMessage(connection, headersBuffer, headers, packet);
		}
	}
	rawServer.on('message', onMessage);
};
