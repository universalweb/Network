import { configure } from '#logs';
function buildConfiguration(configuration) {
	const {
		ip,
		port
	} = this.service.ephemeral;
	configure('CLIENT CONFIGURATION');
	this.configuration = {
		ip,
		port: configuration.servicePort || port,
		maxMTU: configuration.maxMTU || 1000,
		encoding: configuration.encoding || 'binary',
		max: configuration.max || 1280,
	};
}
