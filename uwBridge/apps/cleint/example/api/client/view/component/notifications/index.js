module.exports = async (app) => {
  const {
    thinkyR,
    thinky,
    changes,
    type,
    api,
    socketServer,
    utility: {
      get,
    }
  } = app;
  if (!thinky.models.notification) {
    thinky.createModel('notification', {
      state: type.number()
        .required(),
      read: type.number()
        .required(),
      to: type.string()
        .required(),
      from: type.string()
        .required(),
      sent: type.date()
        .default(thinkyR.now()),
    });
  }
  const NotificationScheme = thinky.models.notification;
  await changes({
    table: 'notification',
    async change(oldVal, newVal) {
      socketServer.push('notification.update', {
        item: newVal
      }, `${newVal.to}Private`);
    },
    async remove(oldVal) {
      socketServer.push('notification.delete', {
        item: oldVal
      }, `${oldVal.to}Private`);
    },
    async add(newVal) {
      socketServer.push('notification.create', {
        item: newVal
      }, `${newVal.to}Private`);
    },
  });
  const scope = {
    async create(notificationObject, socket) {
      try {
        const notification = new NotificationScheme(notificationObject);
        const result = await notification.save();
        if (notificationObject.to === 'hermes') {
          app.model.stats.notifications.system();
        } else {
          app.model.stats
            .add('notifications', socket);
          app.model.stats
            .add('unreadNotifications', socket);
        }
        return result;
      } catch (error) {
        return error;
      }
    }
  };
  app.model.notification = scope;
  const notificationApi = {
    async security(request) {
      return request.socket.login;
    },
    async readAll(request) {
      const {
        socket,
      } = request;
      app.model.stats
        .update(socket.account.id, {
          unreadNotifications: thinkyR.table('notification')
            .filter({
              to: socket.account.id,
            })
            .update({
              read: 1,
            })
            .count(),
        });
    },
    async read(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (get('data.page', body)) ? body.data.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('notification')
        .orderBy({
          index: 'sent',
        })
        .filter((doc) => {
          return doc('from')
            .eq(socket.account.id);
        })
        .map((doc) => {
          return doc.merge({
            originalId: doc('id'),
          })
            .without('id');
        })
        .eqJoin('to', thinkyR.table('user'))
        .zip()
        .map((doc) => {
          return doc.merge({
            id: doc('originalId'),
          });
        })
        .pluck([
          'id',
          'username',
          'to',
          'from',
          'username',
          'sent',
          'status',
          'state',
          'read',
        ])
        .skip(skip)
        .limit(25)
        .run();
      console.log(results);
      response.data.items = results;
      response.data.page = page + 1;
      request.send();
    },
    async system(request) {
      const {
        response,
        body,
      } = request;
      const page = (get('data.page', body)) ? body.data.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('notification')
        .orderBy({
          index: 'sent',
        })
        .filter((doc) => {
          return doc('from')
            .eq(0);
        })
        .map((doc) => {
          return doc.merge({
            originalId: doc('id'),
          })
            .without('id');
        })
        .eqJoin('to', thinkyR.table('user'))
        .zip()
        .map((doc) => {
          return doc.merge({
            id: doc('originalId'),
          });
        })
        .pluck([
          'id',
          'username',
          'to',
          'from',
          'username',
          'sent',
          'status',
          'state',
          'read',
        ])
        .skip(skip)
        .limit(25)
        .run();
      console.log(results);
      response.data.items = results;
      response.data.page = page + 1;
      request.send();
    },
  };
  api.extend(notificationApi, {
    prefix: 'notification'
  });
};
