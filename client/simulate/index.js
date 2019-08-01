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
		request
	} = state;
	const indexFile = await request('sign', {
		test: 123
	});
	console.log(indexFile);
};
