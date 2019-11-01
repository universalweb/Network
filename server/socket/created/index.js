module.exports = (server) => {
	const {
		socketEvents: {
			created: createdEvent,
		},
		socketMethods,
		success
	} = server;
	async function created(socket) {
		await createdEvent(socket);
		success(`socket Created -> ID: ${socket.id}`);
	}
	socketMethods.created = created;
};
