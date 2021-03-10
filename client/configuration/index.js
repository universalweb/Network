module.exports = (socket, configuration) => {
	const {
		ip,
		port
	} = socket.service.ephemeral;
	socket.logImprt('CLIENT CONFIGURATION', __dirname);
	socket.configuration = {
		ip,
		port: configuration.servicePort || port,
		maxMTU: 1000,
		encoding: 'binary',
		max: 1280,
	};
};
