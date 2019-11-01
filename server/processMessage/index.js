module.exports = (server) => {
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
		sockets,
	} = server;
	let count = 0;
	async function processMessage(connection, headersBuffer, headers, packet) {
		const socketId = headers.id;
		const socket = sockets.get(socketId.toString('base64'));
		if (!socket) {
			return false;
		}
		const nonce = headers.nonce;
		const decrypted = decrypt(packet, headersBuffer, nonce, socket.receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		const message = parseMessage(decrypted);
		if (!message) {
			return logError('MSGPack ERROR', connection);
		}
		logReceived(message);
		count++;
		await onMessage(socket, message);
		success(`Messages Received: ${count}`);
	}
	server.processMessage = processMessage;
};
