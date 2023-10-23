import { promise } from '@universalweb/acid';
import { info } from '#logs';
export async function listen() {
	const {
		socket,
		port,
		ip,
	} = this;
	info(`BIND SERVER`, ip, port);
	await promise((accept) => {
		socket.bind(port, ip, accept);
		info(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
	return socket;
}
