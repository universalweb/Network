const {
	promise
} = require('Lucy');
module.exports = async (state) => {
	const {
		server,
		configuration: {
			port,
			ip,
		}
	} = state;
	state.logImprt(`BIND SERVER`, __dirname);
	state.alert(`SERVER: IP:${ip}  -  PORT:${port}`);
	await promise((accept) => {
		server.bind(port, ip, accept);
	});
};
