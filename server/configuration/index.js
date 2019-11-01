module.exports = (server, configure) => {
	server.logImprt('SERVER CONFIGURATION', __dirname);
	const {
		utility: {
			assign
		}
	} = server;
	console.log(configure);
	const {
		ip,
		port
	} = server.profile.ephemeral;
	server.configuration = assign({
		ip,
		port,
		id: '0',
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000
	}, configure);
};
