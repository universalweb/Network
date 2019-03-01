module.exports = async (state) => {
  const {
    streamEvents: {
      created: createdEvent,
    },
    streamMethods,
    success
  } = state;
  async function created(stream) {
    await createdEvent(stream);
    success(`Stream Created -> ID: ${stream.id}`);
  }
  streamMethods.created = created;
};
