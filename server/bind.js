import { promise } from 'Acid';
import { info } from '../utilities/logs.js';
export async function bindServer() {
	const {
		server,
		configuration: {
			port,
			ip,
		}
	} = this;
	info(`BIND SERVER`);
	await promise((accept) => {
		server.bind(port, ip, accept);
		info(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
	return server;
}
