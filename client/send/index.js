module.exports = (udspPrototype) => {
	const {
		logImprt,
		error: logError,
		cnsl,
		success,
		utility: {
			promise,
		},
		crypto: {
			encrypt,
			nonceBox,
			toBase64,
			hashSign
		},
		buildPacketSize,
		buildStringSize,
		error: errorLog,
		logSent,
		encode
	} = udspPrototype;
	logImprt('Send', __dirname);
	// socketId, nonce, encrypted message size, flags, packet size.
	async function send(message) {
		const socket = this;
		const headers = {};
		if (message.head) {
			message.head = encode(message.head);
		}
		if (message.body) {
			message.body = encode(message.body);
		}
		const {
			server,
			configuration: {
				ip,
				port
			}
		} = socket;
		cnsl(`Send to server`);
		const socketStatusCode = socket.status.code;
		console.log(`socket Status Code is ${socketStatusCode}`);
		const nonce = nonceBox();
		success(`Nonce Size: ${nonce.length} ${toBase64(nonce)}`);
		headers.id = socket.serverId || socket.socketId;
		headers.nonce = nonce;
		if (socketStatusCode === 0) {
			// PERFECT FORWARD SECRECY USE RANDOM EPHEMERAL KEY TO ENCRYPT IDENTITY CERT
			headers.key = socket.keypair.publicKey;
			headers.sig = hashSign(socket.keypair.publicKey, socket.keypair.privateKey);
			message.body.cert = socket.ephemeralPublic;
			console.log(`Setting ephemeral random public key to header & profile cert to message.body`);
		}
		console.log('PACKET HEADERS', headers);
		const headersEncoded = encode(headers);
		const headersEndIndex = headersEncoded.length + 3;
		const headersEndIndexBuffer = buildStringSize(headersEndIndex);
		console.log(headersEndIndex, headers);
		const headersCompiled = Buffer.concat([headersEndIndexBuffer, headersEncoded]);
		success(`Additional Data End Index ${headersEndIndex.toString()}`);
		console.log(socket.transmitKey.toString('base64'));
		console.log(message);
		const messageEncoded = encode(message);
		const encryptedMessage = encrypt(messageEncoded, headersEncoded, nonce, socket.transmitKey);
		if (!encryptedMessage) {
			return errorLog('Encryption failed');
		}
		success(`Encrypted Message Size:${encryptedMessage.length} -> ${toBase64(encryptedMessage)}`);
		const encryptedLength = encryptedMessage.length;
		const encryptedDataEndIndex = buildPacketSize(headersEndIndex + 4 + encryptedLength);
		success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
		const messageBuffer = Buffer.concat([
			headersCompiled,
			encryptedDataEndIndex,
			encryptedMessage,
		]);
		console.log(encryptedMessage.toString('base64'));
		const packetSize = messageBuffer.length;
		success(`Packet End Index ${packetSize}`);
		success('Message Buffer Size', Buffer.from(messageBuffer).length);
		if (packetSize >= 1280) {
			errorLog(`WARNING: Packet size is larger than max allowed size -> ${packetSize}`);
		}
		return promise((accept, reject) => {
			server.send(messageBuffer, port, ip, (error) => {
				if (error) {
					logError(error);
					return reject(error);
				}
				logSent(messageBuffer);
				accept();
			});
		});
	}
	udspPrototype.send = send;
};
