module.exports = async (state) => {
	state.logImprt('SERVER CONFIGURATION', __dirname);
	state.configuration = {
		ip: 'localhost',
		port: 8080,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000
	};
};
