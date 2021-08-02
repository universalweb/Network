module.exports = async function ($, client) {
  const {
    changes,
    get
  } = app;
  const clientView = client.user;
  const changeFeed = await changes({
    table: 'user',
    async security(request) {
      const {
        socket,
      } = request;
      return !get('account.id', socket);
    },
    change(socket, oldVal, newVal) {
      socket.push('user.update', {
        item: newVal
      });
    },
    remove(socket, oldVal) {
      socket.push('user.delete', {
        item: oldVal
      });
    },
    add(socket, oldVal, newVal) {
      socket.push('user.create', {
        item: newVal
      });
    },
    filter(oldVal) {
      return this.watchers[oldVal.id];
    }
  });
  clientView.watch = async function (request) {
    const {
      socket,
    } = request;
    changeFeed.watch(socket.account.id, socket, true);
  };
  clientView.unwatch = async function (request) {
    const {
      socket,
    } = request;
    changeFeed.unwatch(socket.account.id, socket);
  };
};
