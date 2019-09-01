module.exports = (state) => {
	const {
		streamEvents: {
			connection: connectionEvent,
		},
		streamMethods,
		success
	} = state;
	async function connection(stream, connectionInfo) {
		const {
			address,
			port
		} = connectionInfo;
		stream.address = connection.address;
		stream.port = connection.port;
		await connectionEvent(stream, address, port);
		success(`Stream Connection -> ID: ${stream.id}
      address: ${address}
      port: ${port}`);
	}
	streamMethods.connection = connection;
};
