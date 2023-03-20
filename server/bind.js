import { promise } from 'Acid';
import { info } from '../utilities/logs.js';
export async function bind(server) {
	const {
		server: rawServer,
		configuration: {
			port,
			ip,
		}
	} = this;
	info(`BIND SERVER`);
	await promise((accept) => {
		rawServer.bind(port, ip, accept);
		info(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
}
