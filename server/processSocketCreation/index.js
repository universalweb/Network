module.exports = (server) => {
	const {
		error: logError,
		success,
		parseMessage,
		crypto: {
			decrypt,
			serverSession,
			signOpen,
			hash,
			signVerify
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
	// additionalData (ad) are the main UDSP headers. It may be called headers at times or additionalData.
	async function processSocketCreation(connection, additionalDataBuffer, additionalData, packet) {
		const signature = additionalData.sig;
		const ephemeralKeypair = additionalData.key;
		success(`Encrypted Message Signature: ${signature.toString('base64')}`);
		success(`Encrypted Message Signature Size: ${signature.length}`);
		const socketId = additionalData.id;
		const nonce = additionalData.nonce;
		success(`Encrypted Message Size: ${packet.length}`);
		const sessionKey = serverSession(serverPublicKey, serverPrivateKey, ephemeralKeypair);
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
			count++;
			console.log(message);
			const isValid = signVerify(signature, message.head.cert.key);
			console.log('SIGNATURE CHECK', isValid);
			if (!isValid) {
				return logError(`Signature isn't valid`);
			}
			const signatureHash = signOpen(signature, message.head.cert.key);
			const sigCompare = Buffer.compare(signatureHash, hash(ephemeralKeypair)) === 0;
			if (sigCompare) {
				logReceived(`Signature is valid`);
				const socket = await createsocket(connection, receiveKey, transmitKey, socketId);
				await onMessage(socket, message);
			} else {
				console.log('SIGNATURE FAILED NO SOCKET CREATED');
				return;
			}
			success(`Messages Received: ${count}`);
		}
	}
	server.processSocketCreation = processSocketCreation;
};
