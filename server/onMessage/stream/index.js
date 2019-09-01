module.exports = async (state) => {
	state.streamMethods = {};
	require('./events')(state);
	require('./connected')(state);
	require('./connection')(state);
	require('./construct')(state);
	require('./created')(state);
	require('./destroy')(state);
	require('./reKey')(state);
	require('./send')(state);
	require('./statusUpdate')(state);
	const {
		streamMethods: {
			destroy,
			construct,
			created,
			connected,
			statusUpdate,
			connection,
			reKey,
			send
		}
	} = state;
	class Stream {
		constructor(connectionInfo, receiveKey, transmitKey, streamId) {
			construct(this, connectionInfo, receiveKey, transmitKey, streamId);
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
		async send(message) {
			await send(this, message);
		}
		async destroy(destroyCode) {
			await destroy(this, destroyCode);
		}
	}
	async function createStream(connectionInfo, receiveKey, transmitKey, streamId) {
		const clientStream = new Stream(connectionInfo, receiveKey, transmitKey, streamId);
		await clientStream.created();
		return clientStream;
	}
	state.createStream = createStream;
};
