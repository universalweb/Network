module.exports = async (app) => {
  const {
    thinkyR,
    changes,
    api,
    socketServer,
    utility: {
      get,
      isEmpty,
    }
  } = app;
  const scope = {
    async updateStats(id) {
      const updateObject = {
        unreadMessages: thinkyR.table('message')
          .filter((doc) => {
            return doc('to')
              .eq(id)
              .and(doc('status')
                .eq(0));
          })
          .count(),
      };
      app.model.stats
        .update(id, updateObject);
    }
  };
  app.model.message = scope;
  const emit = async (type, to, from, data) => {
    socketServer.push(type, data, `${to}Private`);
    socketServer.push(type, data, `${from}Private`);
    scope.updateStats(from);
    scope.updateStats(to);
    app.model.friend
      .updateMessageStat(from, to);
  };
  await changes({
    table: 'message',
    async change(oldVal, newVal) {
      emit('message.update', newVal.to, newVal.from, {
        item: newVal,
      });
    },
    async remove(oldVal) {
      emit('message.delete', oldVal.to, oldVal.from, {
        item: oldVal,
      });
    },
    async add(newVal) {
      emit('message.create', newVal.to, newVal.from, {
        item: newVal,
      });
    },
  });
  const messageApi = {
    async security(request) {
      return request.socket.login;
    },
    async send(request) {
      const {
        body,
        socket,
      } = request;
      const results = await thinkyR.table('friend')
        .filter({
          to: socket.account.id,
          from: body.to,
          status: 1,
        });
      if (isEmpty(results)) {
        return;
      }
      if (!body.message.length) {
        return;
      }
      await thinkyR.table('message')
        .insert({
          from: socket.account.id,
          to: body.to,
          message: body.message.trim(),
          createdAt: thinkyR.now(),
          status: 0,
        })
        .run();
    },
    async read(request) {
      const {
        body,
        response,
        socket,
      } = request;
      const id = body.item.userId;
      console.log(body);
      const page = (get('page', body)) ? body.page : 0;
      const skip = page * 10;
      const results = await thinkyR.table('message')
        .orderBy({
          index: thinkyR.desc('createdAt'),
        })
        .filter((doc) => {
          return doc('from')
            .eq(id)
            .and(doc('to')
              .eq(socket.account.id))
            .or(doc('from')
              .eq(socket.account.id)
              .and(doc('to')
                .eq(id)));
        })
        .skip(skip)
        .limit(10)
        .run();
      response.data.items = results;
      response.data.page = page + 1;
      request.send();
    },
    async readIt(request) {
      const {
        body,
        socket,
      } = request;
      const from = body.item.from;
      const to = socket.account.id;
      await thinkyR.table('message')
        .filter({
          id: body.item.id,
          from,
          to,
        })
        .update({
          status: 1,
        })
        .run();
    },
    async readFriend(request) {
      const {
        body,
        socket,
      } = request;
      const from = body.item.from;
      const to = socket.account.id;
      await thinkyR.table('message')
        .filter({
          from,
          to,
        })
        .update({
          status: 1,
        })
        .run();
    },
    async readAll(request) {
      const {
        body,
        socket,
      } = request;
      const from = body.item.from;
      const to = socket.account.id;
      await thinkyR.table('message')
        .filter({
          from,
          to,
        })
        .update({
          status: 1,
        })
        .run();
    },
  };
  api.extend(messageApi, {
    prefix: 'message',
  });
};
