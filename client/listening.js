module.exports = (state) => {
	state.logImprt('Server onListen', __dirname);
	const {
		server,
		alert,
	} = state;
	function onListening() {
		const connection = server.address();
		alert(`Universal Web Client Server Listening`, connection);
	}
	server.on('listening', onListening);
};
