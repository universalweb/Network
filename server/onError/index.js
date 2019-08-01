module.exports = async (state) => {
	state.logImprt('Server onError', __dirname);
	const {
		server
	} = state;
	async function onError(error) {
		console.log(`server error:\n${error.stack}`);
	}
	server.on('error', onError);
};
