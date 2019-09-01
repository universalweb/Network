module.exports = (stream) => {
	const {
		ip,
		port
	} = stream.service.ephemeral;
	stream.logImprt('SERVER CONFIGURATION', __dirname);
	stream.configuration = {
		ip,
		port,
		maxMTU: 1000,
		encoding: 'binary',
		max: 1280,
	};
};
