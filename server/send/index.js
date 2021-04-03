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
		sendRaw,
		maxPayloadSize
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
		const queued = {
			sid,
			rawMessage,
			options,
			headIndex: 0,
			bodyIndex: 0
		};
		if (head) {
			head = encode(head);
			console.log(chunk(head, 100));
			message.head = head;
			headLength = head.length;
			queued.headLength = headLength;
			size = size + headLength;
			success('HEAD PAYLOAD', headLength);
		}
		if (body) {
			body = encode(body);
			message.body = body;
			bodyLength = body.length;
			queued.bodyLength = bodyLength;
			size = size + bodyLength;
			success('BODY PAYLOAD', bodyLength);
		}
		queued.size = size;
		if (sid) {
			console.log('Queued Message', queued);
			client.sendQueue.set(sid, queued);
		}
		if (size > maxPayloadSize) {
			console.log('SEND - Item is too large will need to chunk into packets.');
			const afterHead = maxPayloadSize - headLength;
			queued.headEnd = afterHead;
			/**
				Both head and body are treated as the same array of data.
				If the head is 200bytes and the body is 200bytes the total range is 400.
				At index range 0 it would be at the start of the header data while 201 may be the start of the body.
				This is used to setup ranges for efficient reliability algorithms & chunking
			*/
			console.log('Room left after head size calculated', afterHead);
		} else {
			return sendRaw(rawMessage, address, port, nonce, transmitKey, id);
		}
	}
	server.send = send;
};
