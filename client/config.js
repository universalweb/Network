import { configure } from '../utilities/logs.js';
function buildConfiguration(configuration) {
	const {
		ip,
		port
	} = this.service.ephemeral;
	configure.logImprt('CLIENT CONFIGURATION');
	this.configuration = {
		ip,
		port: configuration.servicePort || port,
		maxMTU: 1000,
		encoding: 'binary',
		max: 1280,
	};
}
