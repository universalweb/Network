module.exports = (state) => {
	state.logImprt('PUBLIC API INDEX', __dirname);
	require('./api')(state);
	require('./onMessage')(state);
};
