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
	await promise((accept) => {
		server.bind(port, ip, accept);
		state.alert(`SERVER BOUND: IP:${ip}  -  PORT:${port}`);
	});
};
