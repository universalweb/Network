module.exports = (server) => {
	server.logImprt('Server onListen', __dirname);
	const {
		server: rawServer,
		alert,
		utility: {
			stringify
		}
	} = server;
	function onListening() {
		const connection = rawServer.address();
		alert(`Universal Web Server Listening ${stringify(connection)}`);
	}
	rawServer.on('listening', onListening);
};
