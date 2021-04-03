module.exports = (server, configuration) => {
	server.logImprt('SERVER CONFIGURATION', __dirname);
	const {
		utility: {
			assign
		}
	} = server;
	const {
		port: configPort
	} = configuration;
	console.log(configuration);
	const {
		ip,
		port: certPort
	} = server.profile.ephemeral;
	const port = configPort || certPort;
	server.configuration = assign({
		ip,
		port,
		id: '0',
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000,
		maxPayloadSize: 1000
	}, configuration);
};
