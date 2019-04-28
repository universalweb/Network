module.exports = async (state) => {
	state.public = {};
	state.private = {};
	await require('./parseMessage')(state);
	await require('./send')(state);
	await require('./emit')(state);
	await require('./publicAPI')(state);
	await require('./privateAPI')(state);
	await require('./stream')(state);
	await require('./createStreamMessage')(state);
	await require('./processMessage')(state);
	const {
		logImprt,
		success,
		server,
		createStreamMessage,
		processMessage,
		logReceived,
		error: logError,
	} = state;
	logImprt('Server onMessage', __dirname);
	async function onMessage(messageBuffer, connection) {
		logReceived('Message Received');
		const packetSize = messageBuffer.slice(0, 4);
		if (!packetSize) {
			return logError(`No Packet size -> Invalid Packet`);
		}
		const packetEndIndex = Number(packetSize);
		const packet = messageBuffer.slice(4, packetEndIndex + 1);
		success(`Packet size ${packetSize.toString()}`);
		const puzzleFlag = packet.slice(0, 1);
		if (!puzzleFlag) {
			return logError(`No Puzzle Flag -> Invalid Packet`);
		}
		success(`Puzzle Flag ${puzzleFlag.toString()}`);
		const publicKeyFlag = packet.slice(1, 2);
		if (!publicKeyFlag) {
			return logError(`No Public Key Flag -> Invalid Packet`);
		}
		success(`Public Key Flag ${publicKeyFlag.toString()}`);
		if (publicKeyFlag.toString() === '0') {
			success(`No Public Key is given`);
			await processMessage(connection, packet);
		} else {
			success(`Public Key is given -> Processing handshake`);
			await createStreamMessage(connection, packet);
		}
	}
	server.on('message', onMessage);
};
