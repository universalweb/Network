module.exports = (utility) => {
  const {
    assign
  } = utility;
  const socketCommands = {
    killSocket(socket, data) {
      socket.clientValid = false;
      socket.emit('disconnect');
      socket.removeAllListeners();
      socket.disconnect(true);
      console.log('Websocket Attack', data.error);
    },
    sendClient(socket, data, namespace) {
      return socket.emit(namespace || 'api', data);
    }
  };
  assign(utility, socketCommands);
};
