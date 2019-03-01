module.exports = async (state) => {
  state.streamMethods = {};
  await require('./events')(state);
  await require('./connected')(state);
  await require('./connection')(state);
  await require('./construct')(state);
  await require('./created')(state);
  await require('./destroy')(state);
  await require('./reKey')(state);
  await require('./send')(state);
  await require('./statusUpdate')(state);
  const {
    streams,
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
  function checkStream(id, stream) {
    if (!stream.state) {
      stream.destroy(1);
    }
  }
  function isAlive() {
    streams.forEach(checkStream);
  }
  setInterval(isAlive);
};
