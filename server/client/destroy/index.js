module.exports = (server) => {
	const {
		error: logError,
		socketEvents: {
			destroy: destroyEvent,
		},
		clients,
		attention,
		socketMethods
	} = server;
	async function destroy(socket, reason) {
		if (reason === 1) {
			await socket.send({
				status: 580
			});
			logError(`socket ended from inactivity. Grace period ended.
        ID: ${socket.id}
        Address: ${socket.address}
        Port: ${socket.port}
        `);
		} else if (reason === 0) {
			attention(`socket ended due to natural causes
        ID: ${socket.id}
        Address: ${socket.address}
        Port: ${socket.port}
        `);
		}
		await destroyEvent(socket, reason);
		clients.delete(socket.id);
		socket.address = null;
		socket.port = null;
		socket.id = null;
		socket.nonce = null;
		socket.transmitKey = null;
		socket.receiveKey = null;
		socket.lastAct = null;
	}
	socketMethods.destroy = destroy;
};
