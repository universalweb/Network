module.exports = async function ($, client) {
  const {
    changes,
    thinkyR,
    get,
    eachAsync,
  } = app;
  const scope = $('stats', {});
  const clientView = {};
  client.stats = clientView;
  const changeFeed = await changes({
    table: 'stats',
    change(socket, oldVal, newVal) {
      socket.push('stats.update', {
        item: newVal,
      });
    },
    remove(socket, oldVal) {
      socket.push('stats.delete', {
        item: oldVal,
      });
    },
    add(socket, oldVal, newVal) {
      socket.push('stats.create', {
        item: newVal,
      });
    },
    filter(oldVal, newVal) {
      const id = (newVal) ? newVal.id : oldVal.id;
      return this.watchers[id];
    },
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
  clientView.read = async function (request) {
    const {
      response,
      socket,
    } = request;
    const results = await thinkyR.table('stats')
      .get(socket.account.id)
      .run();
    response.data.item = results;
    request.send();
  };
  clientView.security = async function (request) {
    const {
      socket,
    } = request;
    return !get('account.id', socket);
  };
  scope.get = async function (id, pluck) {
    return thinkyR.table('stats').get(id).pluck([pluck]);
  };
  scope.update = async function (id, updated) {
    await thinkyR.table('stats')
      .get(id)
      .update(updated, {
        nonAtomic: true
      })
      .run();
  };
  scope.add = async function (name, id, amount = 1) {
    const stats = await scope.get(id, name)
      .update({
        count: thinkyR.row(name)
          .default(0)
          .add(amount),
      })
      .run();
    return stats;
  };
  scope.subtract = async function (name, id, amount = 1) {
    const stats = await scope.get(id, name)
      .update({
        count: thinkyR.row(name)
          .default(0)
          .sub(amount),
      })
      .run();
    return stats;
  };

  /* Create Stats For old users*/
  const totalUsers = await thinkyR.table('user')
    .run();
  await eachAsync(totalUsers, async function (item) {
    const id = item.id;
    const hasStats = await thinkyR.table('stats')
      .get(id)
      .run();
    if (!hasStats) {
      await thinkyR.table('stats')
        .insert({
          id,
        })
        .run();
    }
  });
};
