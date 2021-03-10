module.exports = (server) => {
	const {
		socketEvents: {
			statusUpdate: statusUpdateEvent,
		},
		socketMethods,
		success
	} = server;
	async function statusUpdate(socket) {
		socket.state = Date.now();
		await statusUpdateEvent(socket);
		success(`socket statusUpdate -> ID: ${socket.id}`);
	}
	socketMethods.statusUpdate = statusUpdate;
};
