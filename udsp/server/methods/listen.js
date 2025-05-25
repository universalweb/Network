import { hasValue, promise } from '@universalweb/acid';
export async function listen(portArg) {
	const {
		socket,
		ip,
	} = this;
	const port = hasValue(portArg) ? portArg : this.port;
	this.logInfo(`BIND SERVER`, ip, port);
	await promise((accept) => {
		socket.bind(port, ip, accept);
		this.logInfo(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
	return socket;
}
