module.exports = async (state, configure) => {
	state.logImprt('SERVER CONFIGURATION', __dirname);
	const {
		utility: {
			assign
		}
	} = state;
	console.log(configure);
	const {
		ip,
		port
	} = state.profile.ephemeral;
	state.configuration = assign({
		ip,
		port,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000
	}, configure);
};
