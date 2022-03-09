module.exports = async (app) => {
	const {
		config,
		utility: {
			eachArray, ifInvoke
		},
	} = app;
	const namespace = config.name;
	const socketEventApi = {
		async connect(socket) {
			console.log(socket.ip, 'Connected');
			const userAgent = socket.request.headers['user-agent'];
			console.log(userAgent, 'Connected');
			socket.join(namespace);
			const onLogoutMap = {};
			socket.onLogout = (key, item) => {
				if (!onLogoutMap[key]) {
					onLogoutMap[key] = item;
				}
			};
			socket.logout = () => {
				eachArray(onLogoutMap, (item) => {
					ifInvoke(onLogoutMap[item], socket);
					onLogoutMap[item] = null;
				});
			};
			socket.onExit(socket.id, socket.logout);
		},
		async disconnect(socket, endPoint) {
			console.log('DISCONECT', socket.id, endPoint);
		},
		async joinGroup(socket, endPoint) {
			console.log(endPoint, socket.id);
		},
		async kill(data, socket) {
			console.log('KILL', data, socket.id);
		},
		async leaveGroup(socket, endPoint) {
			console.log('leaveGroup', socket.id, endPoint);
		},
	};
	app.client.socketEvent = socketEventApi;
};
