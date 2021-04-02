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
			signVerify,
			toBase64,
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
		createClient
	} = server;
	let count = 0;
	alert(toBase64(serverPrivateKey));
	// additionalData (ad) are the main UDSP headers. It may be called headers at times or additionalData.
	async function processSocketCreation(connection, additionalDataBuffer, additionalData, packet) {
		const signature = additionalData.sig;
		const ephemeralKeypair = additionalData.key;
		success(`Encrypted Message Signature: ${toBase64(signature)}`);
		success(`Encrypted Message Signature Size: ${signature.length}`);
		const clientId = additionalData.id;
		const nonce = additionalData.nonce;
		success(`Encrypted Message Size: ${packet.length}`);
		const sessionKey = serverSession(serverPublicKey, serverPrivateKey, ephemeralKeypair);
		const receiveKey = sessionKey.receiveKey;
		const transmitKey = sessionKey.transmitKey;
		success(`receiveKey: ${toBase64(receiveKey)}`);
		success(`transmitKey: ${toBase64(transmitKey)}`);
		console.log(toBase64(packet));
		console.log(toBase64(nonce));
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
				const client = await createClient(connection, receiveKey, transmitKey, clientId);
				await onMessage(client, message);
			} else {
				console.log('SIGNATURE FAILED NO SOCKET CREATED');
				return;
			}
			success(`Messages Received: ${count}`);
		}
	}
	server.processSocketCreation = processSocketCreation;
};
