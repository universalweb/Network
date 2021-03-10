module.exports = (server) => {
	const {
		success,
		attention
	} = server;
	server.socketEvents = {
		async connected(socket) {
			success(`socket EVENT -> connected - ID:${socket.id}`);
		},
		async connection(socket) {
			attention(`socket EVENT -> connection - ID:${socket.id}`);
		},
		async created(socket) {
			attention(`socket EVENT -> created - ID:${socket.id}`);
		},
		async destroy(socket) {
			attention(`socket EVENT -> destroy - ID:${socket.id}`);
		},
		async identity(socket) {
			attention(`socket EVENT -> identity - ID:${socket.id}`);
		},
		async reKey(socket) {
			attention(`socket EVENT -> reKey - ID:${socket.id}`);
		},
		async sent(socket) {
			attention(`socket EVENT -> sent - ID:${socket.id}`);
		},
		async statusUpdate(socket) {
			attention(`socket EVENT -> statusUpdate - ID:${socket.id}`);
		},
	};
};
