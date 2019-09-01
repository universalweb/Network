module.exports = async (state) => {
	state.certificates = {};
	await require('./master')(state);
	await require('./ephemeral')(state);
	await require('./domain')(state);
	await require('./identity')(state);
	await require('./root')(state);
};
