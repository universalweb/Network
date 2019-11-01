module.exports = (server) => {
	server.logImprt('Server onError', __dirname);
	const {
		server: rawServer,
	} = server;
	async function onError(error) {
		console.log(`server error:\n${error.stack}`);
	}
	rawServer.on('error', onError);
};
