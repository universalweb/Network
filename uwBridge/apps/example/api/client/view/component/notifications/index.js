module.exports = async function ($, client) {
  const scope = $('notification', {}),
    clientView = {};
  const {
    thinkyR,
    thinky,
    changes,
    get,
    type,
    assign,
  } = app;
  client.notification = clientView;
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
  const notificationModel = thinky.models.notification;
  scope.create = async function (notificationObject, socket) {
    try {
      const dbModel = new notificationModel(notificationObject);
      const result = await dbModel.save();
      $('stats').add('notifications', socket);
      $('stats').add('unreadNotifications', socket);
      return result;
    } catch (error) {
      return error;
    }
  };
  const changeFeed = await changes({
    table: 'notification',
    change(socket, oldVal, newVal) {
      socket.push('notification.update', {
        item: newVal,
      });
    },
    remove(socket, oldVal) {
      socket.push('notification.delete', {
        item: oldVal,
      });
    },
    add(socket, oldVal, newVal) {
      socket.push('notification.create', {
        item: newVal,
      });
    },
    filter(oldVal, newVal) {
      const idTo = (!newVal) ? oldVal.to : newVal.to;
      return [this.watchers[idTo]];
    },
  });
  assign(clientView, {
    async watch(request) {
      const {
        socket,
      } = request;
      changeFeed.watch(socket.account.id, socket, true);
    },
    async unwatch(request) {
      const {
        socket,
      } = request;
      changeFeed.unwatch(socket.account.id, socket);
    },
    async readAll(request) {
      const {
        socket,
      } = request;
      $('stats').update(socket.account.id, {
        unreadNotifications: thinkyR.table('notification')
          .filter({
            to: socket.account.id,
          })
          .update({
            read: 1,
          })
          .count()
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
        .filter(doc => doc('from')
            .eq(socket.account.id)
            .and(doc('status')
              .eq(body.staus || 1)))
        .map(doc => doc.merge({
          originalId: doc('id'),
        })
            .without('id'))
        .eqJoin('to', thinkyR.table('user'))
        .zip()
        .map(doc => doc.merge({
          id: doc('originalId'),
        }))
        .pluck([
          'id',
          'username',
          'to',
          'from',
          'username',
          'sent',
          'status',
          'state',
          'read'
        ])
        .skip(skip)
        .limit(25)
        .run();
      console.log(results);
      response.data.items = results;
      response.data.page = page + 1;
      request.send();
    },
    async security(request) {
      const {
        socket,
      } = request;
      return !get('account.id', socket);
    },
  });
};
