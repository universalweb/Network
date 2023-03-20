import { assign } from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
export function configure(configuration) {
	info('SERVER CONFIGURATION');
	const { port: configPort } = configuration;
	console.log(configuration);
	const {
		ip,
		port: certPort
	} = this.profile.ephemeral;
	const port = configPort || certPort;
	this.configuration = assign({
		ip,
		port,
		id: '0',
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000,
		maxPayloadSize: 1000
	}, configuration);
}
