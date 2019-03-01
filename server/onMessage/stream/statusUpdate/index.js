module.exports = async (state) => {
  const {
    streamEvents: {
      statusUpdate: statusUpdateEvent,
    },
    streamMethods,
    success
  } = state;
  async function statusUpdate(stream) {
    stream.state = Date.now();
    await statusUpdateEvent(stream);
    success(`Stream statusUpdate -> ID: ${stream.id}`);
  }
  streamMethods.statusUpdate = statusUpdate;
};
