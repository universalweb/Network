const {
	promise
} = require('Acid');
module.exports = async (server) => {
	const {
		server: rawServer,
		configuration: {
			port,
			ip,
		}
	} = server;
	server.logImprt(`BIND SERVER`, __dirname);
	await promise((accept) => {
		rawServer.bind(port, ip, accept);
		server.alert(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
};
