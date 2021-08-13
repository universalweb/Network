module.exports = async (app) => {
  const {
    changes,
    socketServer
  } = app;
  await changes({
    table: 'user',
    change(oldVal, item) {
      socketServer.push('user.update', {
        item,
      }, `${item.id}Private`);
    },
    remove(item) {
      socketServer.push('user.delete', {
        item,
      }, `${item.id}Private`);
    },
    add(item) {
      socketServer.push('user.create', {
        item,
      }, `${item.id}Private`);
    },
  });
};
