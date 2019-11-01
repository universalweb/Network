module.exports = (socket) => {
	const {
		ip,
		port
	} = socket.service.ephemeral;
	socket.logImprt('CLIENT CONFIGURATION', __dirname);
	socket.configuration = {
		ip,
		port,
		maxMTU: 1000,
		encoding: 'binary',
		max: 1280,
	};
};
