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
		clients,
	} = server;
	let count = 0;
	async function processMessage(connection, headersBuffer, headers, packet) {
		const clientId = headers.id;
		const client = clients.get(clientId.toString('base64'));
		if (!client) {
			return false;
		}
		const nonce = headers.nonce;
		const decrypted = decrypt(packet, headersBuffer, nonce, client.receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		const message = parseMessage(decrypted);
		if (!message) {
			return logError('MSGPack ERROR', connection);
		}
		logReceived(message);
		count++;
		await onMessage(client, message);
		success(`Messages Received: ${count}`);
	}
	server.processMessage = processMessage;
};
