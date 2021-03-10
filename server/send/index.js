module.exports = (server) => {
	require('./raw')(server);
	const {
		logImprt,
		encode,
		crypto: {
			toBase64
		},
		utility: {
			chunk,
		},
		success,
		sendRaw
	} = server;
	logImprt('Send', __dirname);
	// socketId, nonce, encrypted message size, flags, packet size.
	async function send(rawMessage, address, port, nonce, transmitKey, id) {
		success(`PROCESSING MESSAGE TO SEND`);
		console.log(rawMessage);
		success(`socketId: ${id.toString('base64')}`);
		success(`Transmit Key ${toBase64(transmitKey)}`);
		if (rawMessage.head) {
			rawMessage.head = encode(rawMessage.head);
		}
		if (rawMessage.body) {
			rawMessage.body = encode(rawMessage.body);
		}
		success('HEAD PAYLOAD');
		console.log(rawMessage.head.length, chunk());
		success('BODY PAYLOAD');
		console.log(rawMessage.body.length);
		return sendRaw(rawMessage, address, port, nonce, transmitKey, id);
	}
	server.send = send;
};
