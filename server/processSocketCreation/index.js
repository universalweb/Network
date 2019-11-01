module.exports = (server) => {
	const {
		error: logError,
		success,
		parseMessage,
		crypto: {
			decrypt,
			serverSession,
		},
		api: {
			onMessage
		},
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
		alert,
		logReceived,
		createsocket
	} = server;
	let count = 0;
	alert(serverPrivateKey.toString('base64'));
	async function processSocketCreation(connection, additionalDataBuffer, additionalData, packet) {
		const ephemeralCertificate = additionalData.cert;
		const socketId = additionalData.id;
		const nonce = additionalData.nonce;
		success(`Encrypted Message Size: ${packet.length}`);
		const sessionKey = serverSession(serverPublicKey, serverPrivateKey, ephemeralCertificate.key);
		const receiveKey = sessionKey.receiveKey;
		const transmitKey = sessionKey.transmitKey;
		success(`receiveKey: ${receiveKey.toString('base64')}`);
		success(`transmitKey: ${transmitKey.toString('base64')}`);
		console.log(packet.toString('base64'));
		console.log(nonce.toString('base64'));
		const decrypted = decrypt(packet, additionalDataBuffer, nonce, receiveKey);
		if (!decrypted) {
			return logError(`Decrypt Failed`);
		}
		success(`Decrypted`);
		if (decrypted) {
			const message = parseMessage(decrypted);
			if (!message) {
				return logError('JSON ERROR', connection);
			}
			logReceived(message);
			count++;
			const socket = await createsocket(connection, receiveKey, transmitKey, socketId, ephemeralCertificate);
			await onMessage(socket, message);
			success(`Messages Received: ${count}`);
		}
	}
	server.processSocketCreation = processSocketCreation;
};
