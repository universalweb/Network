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
	require('./createResponse')(server);
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
		},
		crypto: {
			toBase64
		}
	} = server;
	class Client {
		constructor(connectionInfo, receiveKey, transmitKey, clientId) {
			construct(this, connectionInfo, receiveKey, transmitKey, clientId);
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
	async function createClient(connectionInfo, receiveKey, transmitKey, clientId) {
		console.log('Creating Client Object', toBase64(clientId));
		const client = new Client(connectionInfo, receiveKey, transmitKey, clientId);
		await client.created();
		console.log('Client has been created', toBase64(clientId));
		return client;
	}
	server.createClient = createClient;
};
