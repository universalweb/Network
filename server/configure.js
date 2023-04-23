import { assign } from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export function configure(source) {
	const { configuration } = source;
	info('SERVER CONFIGURATION');
	const { port: configPort } = configuration;
	console.log(configuration);
	const {
		ip,
		port: certPort
	} = this.profile.ephemeral;
	const port = configPort || certPort;
	assign(configuration, {
		ip,
		port,
		id: '0',
		maxMTU: 1000,
		encoding: 'utf8',
		max: 1000,
		maxPayloadSize: 1000
	});
}
