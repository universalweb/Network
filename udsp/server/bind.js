import { promise } from 'Acid';
import { info } from '#logs';
export async function bindServer() {
	const {
		server,
		port,
		ip,
	} = this;
	info(`BIND SERVER`, ip, port);
	await promise((accept) => {
		server.bind(port, ip, accept);
		info(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
	return server;
}
