module.exports = async (state) => {
	state.logImprt('Private API INDEX', __dirname);
	await require('./api')(state);
	await require('./onMessage')(state);
};
