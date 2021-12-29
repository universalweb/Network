module.exports = async (app) => {
	app.system.network = {};
	console.log('Network started');
	await require('./http')(app);
	return console.log('HTTP Online');
};
