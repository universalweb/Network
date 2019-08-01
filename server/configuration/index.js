module.exports = async (state, configure) => {
	state.logImprt('SERVER CONFIGURATION', __dirname);
	const {
		utility: {
			assign
		}
	} = state;
	console.log(configure);
	state.configuration = assign({
		ip: 'localhost',
		port: 8080,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000
	}, configure);
};
