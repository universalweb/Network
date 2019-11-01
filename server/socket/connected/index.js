module.exports = (server) => {
	const {
		socketEvents: {
			connected: connectedEvent,
		},
		socketMethods,
		success
	} = server;
	async function connected(socket) {
		socket.lastAct = Date.now();
		clearTimeout(socket.gracePeriod);
		await connectedEvent(socket);
		success(`socket Connected -> ID: ${socket.id}`);
	}
	socketMethods.connected = connected;
};
