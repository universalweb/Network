module.exports = async (state) => {
	state.logImprt('PUBLIC API INDEX', __dirname);
	await require('./app')(state);
	await require('./api')(state);
	require('./onMessage')(state);
};
