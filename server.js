(async () => {
	const server = await require('./server/index.js')();
	console.log('Server Status', server.status);
})();
