module.exports = async function ($, client) {
  const scope = $('chat', {}),
    {
      view,
      thinkyR,
      changes,
      get,
      isEmpty
    } = $,
    thisView = {};
  client.chat = thisView;
  /*
    0 - pending
    1 - accepted
    2 - declined
    3 - blocked
    4 - muted
    5 - following
  */
  thisView.security = async function (request) {
    const {
      socket,
    } = request;
    return !get('account.id', socket);
  };
  const changeFeed = await changes({
    table: 'message',
    change(socket, oldVal, newVal) {
      socket.push('message.update', {
        item: newVal
      });
    },
    remove(socket, oldVal) {
      socket.push('message.delete', {
        item: oldVal
      });
    },
    add(socket, oldVal, newVal) {
      socket.push('message.create', {
        item: newVal
      });
    },
    filter(oldVal, newVal) {
      const idTo = (!newVal) ? oldVal.to : newVal.to,
        group = (!newVal) ? oldVal.group : newVal.group,
        idFrom = (!newVal) ? oldVal.from : newVal.from;
      return [this.watchers[idTo], this.watchers[idFrom], this.watchers.group[group]];
    }
  });
  changeFeed.watchers.group = {};
  thisView.watch = function (request) {
    const {
      socket,
    } = request;
    changeFeed.watch(socket.account.id, socket, true);
  };
  thisView.unwatch = function (request) {
    const {
      socket,
    } = request;
    changeFeed.unwatch(socket.account.id, socket);
  };
  thisView.sendFriend = async function (request) {
    const {
      body,
      socket,
    } = request;
    const results = await thinkyR.table('friend')
      .filter({
        to: socket.account.id,
        from: body.to,
        status: 1
      });
    if (isEmpty(results)) {
      return;
    }
    await thinkyR.table('message')
      .insert({
        from: socket.account.id,
        to: body.to,
        message: body.message.trim(),
        createdAt: thinkyR.now()
      })
      .run();
  };
  thisView.read = async function (request) {
    const {
      body,
      socket,
    } = request;
    await thinkyR.table('message')
      .filter({
        id: body.item.id,
        from: body.item.from,
        to: socket.account.id,
      })
      .update({
        read: 1
      });
  };
  thisView.readAll = async function (request) {
    const {
      body,
      socket,
    } = request;
    await thinkyR.table('message')
      .filter({
        from: body.item.from,
        to: socket.account.id,
      })
      .update({
        read: 1
      });
  };
  thisView.delete = async function (request) {
    const {
      body,
      socket,
    } = request;
    await thinkyR.table('friend')
      .filter({
        id: body.item.id,
        from: socket.account.id,
        to: body.item.to,
      })
      .delete()
      .run();
    await thinkyR.table('friend')
      .filter({
        id: body.item.id,
        to: socket.account.id,
        from: body.item.to,
      })
      .delete()
      .run();
  };
};
