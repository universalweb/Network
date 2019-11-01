module.exports = (server) => {
	server.socketMethods = {};
	require('./events')(server);
	require('./connected')(server);
	require('./connection')(server);
	require('./construct')(server);
	require('./created')(server);
	require('./destroy')(server);
	require('./reKey')(server);
	require('./send')(server);
	require('./statusUpdate')(server);
	const {
		socketMethods: {
			destroy,
			construct,
			created,
			connected,
			statusUpdate,
			connection,
			reKey,
			send
		}
	} = server;
	class UDSPSocket {
		constructor(connectionInfo, receiveKey, transmitKey, socketId) {
			construct(this, connectionInfo, receiveKey, transmitKey, socketId);
		}
		async created() {
			await created(this);
		}
		async connected() {
			await connected(this);
		}
		async statusUpdate() {
			await statusUpdate(this);
		}
		async connection(connectionInfo) {
			await connection(this, connectionInfo);
		}
		async reKey(clientKeypair) {
			await reKey(this, clientKeypair);
		}
		async send(message, frameHeaders) {
			await send(this, message, frameHeaders);
		}
		async destroy(destroyCode) {
			await destroy(this, destroyCode);
		}
	}
	async function createsocket(connectionInfo, receiveKey, transmitKey, socketId) {
		const clientsocket = new UDSPSocket(connectionInfo, receiveKey, transmitKey, socketId);
		await clientsocket.created();
		return clientsocket;
	}
	server.createsocket = createsocket;
};
