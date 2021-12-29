module.exports = async (app) => {
	await require('./cache')(app);
	console.log('cache loaded');
	await require('./security')(app);
	console.log('security loaded');
	await require('./network')(app);
	console.log('network loaded');
};
