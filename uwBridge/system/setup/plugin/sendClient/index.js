module.exports = (utility) => {
	const {
		assign
	} = utility;
	const socketCommands = {
		killSocket(socket, data) {
			console.log(data);
			socket.clientValid = false;
			socket.removeAllListeners();
			socket.disconnect(true);
			console.log('Websocket Attack', data.error);
		},
		sendClient(socket, data, namespace) {
			return socket.emit(namespace || 'api', data);
		},
	};
	assign(utility, socketCommands);
};
