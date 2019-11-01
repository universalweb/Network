module.exports = (server) => {
	const {
		socketEvents: {
			connection: connectionEvent,
		},
		socketMethods,
		success
	} = server;
	async function connection(socket, connectionInfo) {
		const {
			address,
			port
		} = connectionInfo;
		socket.address = connection.address;
		socket.port = connection.port;
		await connectionEvent(socket, address, port);
		success(`socket Connection -> ID: ${socket.id}
      address: ${address}
      port: ${port}`);
	}
	socketMethods.connection = connection;
};
