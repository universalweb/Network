module.exports = async (state, ip, port) => {
	state.logImprt('SERVER CONFIGURATION', __dirname);
	state.configuration = {
		ip,
		port,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000
	};
};
