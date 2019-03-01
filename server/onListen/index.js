module.exports = async (state) => {
  state.logImprt('Server onListen', __dirname);
  const {
    server,
    alert,
    utility: {
      stringify
    }
  } = state;
  function onListening() {
    const connection = server.address();
    alert(`Universal Data Stream Protocol Listening ${stringify(connection)}`);
  }
  server.on('listening', onListening);
};
