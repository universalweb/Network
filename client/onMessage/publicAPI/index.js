module.exports = async (state) => {
	state.logImprt('PUBLIC API INDEX', __dirname);
	await require('./api')(state);
	await require('./onMessage')(state);
};
