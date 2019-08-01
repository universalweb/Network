module.exports = async (state) => {
	state.public = {};
	state.private = {};
	await require('./parseMessage')(state);
	await require('./emit')(state);
	await require('./publicAPI')(state);
	const {
		logImprt,
		success,
		server,
		parseMessage,
		public: {
			onMessage: publicOnMessage
		},
		error: logError,
		pluckBuffer,
		crypto: {
			decrypt
		},
		sessionKeys: {
			receiveKey
		}
	} = state;
	logImprt('Server onMessage', __dirname);
	async function onMessage(messageBuffer, connection) {
		success('ON MESSAGE');
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
		if (packet.length) {
			const streamIDEndIndex = 9;
			const streamID = pluckBuffer(packet, 1, streamIDEndIndex, `streamID`, 'base64');
			if (!streamID) {
				return;
			}
			const nonceEndIndex = streamIDEndIndex + 24;
			const nonce = pluckBuffer(packet, streamIDEndIndex, nonceEndIndex, `nonce`, 'base64');
			if (!nonce) {
				return;
			}
			const encryptedLengthEndIndex = nonceEndIndex + 4;
			const encryptedLength = pluckBuffer(packet, nonceEndIndex, encryptedLengthEndIndex, `encrypted`, 'base64');
			if (!encryptedLength) {
				return;
			}
			const encryptedEndIndex = Number(encryptedLength.toString()) + encryptedLengthEndIndex;
			const encrypted = pluckBuffer(packet, encryptedLengthEndIndex, encryptedEndIndex, `encrypted Message`, 'base64');
			if (!encrypted) {
				return;
			}
			const additionalDataBuffer = Buffer.concat([
				puzzleFlag,
				streamID,
				nonce
			]);
			const decrypted = decrypt(encrypted, additionalDataBuffer, nonce, receiveKey);
			if (!decrypted) {
				return logError(`Decrypt Failed`);
			}
			const plainText = decrypted.toString();
			success(`Decrypted ${plainText}`);
			const jsonString = plainText;
			const json = parseMessage(jsonString);
			publicOnMessage(json, puzzleFlag, packet, connection);
		}
	}
	server.on('message', onMessage);
};
