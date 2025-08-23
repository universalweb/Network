import { hasValue, promise } from '@universalweb/utilitylib';
import { info } from '#logs';
export async function listen(portArg) {
	const {
		socket,
		ip,
	} = this;
	const port = hasValue(portArg) ? portArg : this.port;
	info(`BIND SERVER`, ip, port);
	await promise((accept) => {
		socket.bind(port, ip, accept);
		info(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
	return socket;
}
