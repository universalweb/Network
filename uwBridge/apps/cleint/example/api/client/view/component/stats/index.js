module.exports = async (app) => {
  const {
    changes,
    thinkyR,
    socketServer,
    api,
  } = app;
  await changes({
    table: 'stats',
    change(oldVal, newVal) {
      socketServer.push('stats.update', {
        item: newVal,
      }, `${newVal.id}Private`);
    },
    remove(oldVal) {
      socketServer.push('stats.delete', {
        item: oldVal,
      }, `${oldVal.id}Private`);
    },
    add(newVal) {
      socketServer.push('stats.create', {
        item: newVal,
      }, `${newVal.id}Private`);
    },
  });
  const scope = {
    async get(id, pluck) {
      return thinkyR.table('stats').get(id)
        .pluck([pluck]);
    },
    async update(id, updated) {
      await thinkyR.table('stats')
        .get(id)
        .update(updated, {
          nonAtomic: true,
        })
        .run();
    },
    async add(statName, id, amount = 1) {
      const stats = await scope.get(id, statName)
        .update({
          count: thinkyR.row(statName)
            .default(0)
            .add(amount),
        })
        .run();
      return stats;
    },
    async subtract(statName, id, amount = 1) {
      const stats = await scope.get(id, statName)
        .update({
          count: thinkyR.row(statName)
            .default(0)
            .sub(amount),
        })
        .run();
      return stats;
    },
    notifications: {
      async system(amount) {
        await thinkyR.table('stats')
          .update({
            count: thinkyR.row('notifications')
              .default(0)
              .add(amount),
          })
          .run();
        await thinkyR.table('stats')
          .update({
            count: thinkyR.row('systemNotifications')
              .default(0)
              .add(amount),
          })
          .run();
        await thinkyR.table('stats')
          .update({
            count: thinkyR.row('unReadSystemNotifications')
              .default(0)
              .add(amount),
          })
          .run();
      }
    }
  };
  app.model.stats = scope;
  const statsApi = {
    async read(request) {
      const {
        response,
        socket,
      } = request;
      const results = await thinkyR.table('stats')
        .get(socket.account.id)
        .run();
      response.data.item = results;
      request.send();
    },
    async security(request) {
      return request.socket.login;
    },
  };
  api.extend(statsApi, {
    prefix: 'profile'
  });
};
