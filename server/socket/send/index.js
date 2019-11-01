module.exports = (server) => {
	const {
		send: sendClient,
		socketEvents: {
			sent: sentEvent,
		},
		socketMethods,
		success
	} = server;
	async function send(socket, message) {
		await sendClient(message, socket.address, socket.port, socket.nonce, socket.transmitKey, socket.clientIdRaw);
		await sentEvent(socket, message);
		success(`socket Sent -> ID: ${socket.id}`);
	}
	socketMethods.send = send;
};
