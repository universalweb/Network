module.exports = async function ($, client) {
  const scope = $('message', {}),
    {
      thinkyR,
      changes,
      get,
      isEmpty,
    } = $,
    thisView = {};
  client.message = thisView;
  thisView.security = async function (request) {
    const {
      socket,
    } = request;
    return !get('account.id', socket);
  };
  const changeFeed = await changes({
    table: 'message',
    security: thisView.security,
    async change(socket, oldVal, newVal) {
      socket.push('message.update', {
        item: newVal,
      });
    },
    async remove(socket, oldVal) {
      socket.push('message.delete', {
        item: oldVal,
      });
    },
    async add(socket, oldVal, newVal) {
      socket.push('message.create', {
        item: newVal,
      });
    },
    async filter(oldVal, newVal) {
      const idTo = (!newVal) ? oldVal.to : newVal.to,
        idFrom = (!newVal) ? oldVal.from : newVal.from;
      await scope.updateStats(idTo);
      await scope.updateStats(idFrom);
      await $('friend').updateMessageStat(idFrom, idTo);
      return [
        this.watchers[idTo],
        this.watchers[idFrom]
      ];
    },
  });
  thisView.watch = async (request) => {
    const {
      socket,
    } = request;
    changeFeed.watch(socket.account.id, socket, true);
  };
  thisView.unwatch = async (request) => {
    const {
      socket,
    } = request;
    changeFeed.unwatch(socket.account.id, socket);
  };
  thisView.sendFriend = async (request) => {
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
    await scope.updateStats(body.to);
  };
  thisView.read = async (request) => {
    const {
      body,
      response,
      socket,
    } = request;
    const id = body.item.userId;
    console.log(body);
    const page = (get('page', body)) ? body.page : 0;
    const skip = page * 25;
    const results = await thinkyR.table('message')
      .orderBy({
        index: thinkyR.desc('createdAt'),
      })
      .filter(doc => doc('from')
        .eq(id)
        .and(doc('to')
          .eq(socket.account.id))
        .or(doc('from')
          .eq(socket.account.id)
          .and(doc('to')
            .eq(id))))
      .skip(skip)
      .limit(25)
      .run();
    response.data.items = results;
    response.data.page = page + 1;
    request.send();
  };
  thisView.readIt = async (request) => {
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
    await $('friend').updateMessageStat(from, to);
  };
  thisView.readFriend = async (request) => {
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
    await $('friend').updateMessageStat(from, to);
  };
  thisView.readAll = async (request) => {
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
        status: 1,
      })
      .run();
  };
  scope.updateMessageStat = async (id) => {
    const unreadMessages = await thinkyR.table('message')
      .filter(doc => doc('to')
        .eq(id)
        .and(doc('status')
          .eq(0)))
      .count()
      .run();
    const updateObject = {
      unreadMessages,
    };
    console.log(updateObject);
  };
  scope.updateStats = async (id) => {
    const updateObject = {
      unreadMessages: thinkyR.table('message')
        .filter(doc => doc('to')
          .eq(id)
          .and(doc('status')
            .eq(0)))
        .count(),
    };
    $('stats')
      .update(id, updateObject);
  };
};
