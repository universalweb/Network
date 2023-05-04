import { assign } from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export function configure(source) {
	info('SERVER CONFIGURATION');
	console.log('Server provided config', source.configuration);
	const {
		ip: certIp,
		port: certPort
	} = source.profile.ephemeral;
	const port = source.configuration.port || certPort;
	const ip = source.configuration.ip || certIp;
	assign(source, {
		ip,
		port,
	});
}
