module.exports = async (state) => {
	const {
		logImprt,
		profile: {
			activate: activateProfile
		},
	} = state;
	logImprt('Simulation', __dirname);
	await activateProfile('default');
	const {
		request,
		api: {
			connect
		}
	} = state;
	const handshake = await connect('localhost', 8080);
	console.log(handshake);
	const indexFile = await request('file', {
		path: 'index.html'
	});
	console.log(indexFile);
};
