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
	// clientId, nonce, encrypted message size, flags, packet size.
	async function send(client, rawMessage, options) {
		const {
			address,
			port,
			nonce,
			transmitKey,
			clientIdRaw: id
		} = client;
		const {
			sid
		} = rawMessage;
		success(`PROCESSING MESSAGE TO SEND`);
		console.log('Packet Options', options);
		console.log('Raw Message', rawMessage);
		success(`clientId: ${toBase64(id)}`);
		success(`Transmit Key ${toBase64(transmitKey)}`);
		let size = 0;
		let headLength = 0;
		let bodyLength = 0;
		let {
			head,
			body
		} = rawMessage;
		const message = rawMessage;
		const sendObject = {
			sid,
			rawMessage,
			options
		};
		if (head) {
			head = encode(head);
			console.log(chunk(head, 100));
			message.head = head;
			headLength = head.length;
			size = size + headLength;
			success('HEAD PAYLOAD', headLength);
		}
		if (body) {
			body = encode(body);
			message.body = body;
			bodyLength = body.length;
			size = size + bodyLength;
			success('BODY PAYLOAD', bodyLength);
		}
		if (sid) {
			client.sendQueue.set(sid, sendObject);
		}
		if (size > 1000) {
			console.log('Send item is too large will need to chunk into packets.');
		} else {
			return sendRaw(rawMessage, address, port, nonce, transmitKey, id);
		}
	}
	server.send = send;
};
