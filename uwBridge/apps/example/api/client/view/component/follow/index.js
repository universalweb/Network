module.exports = async function ($, client) {
  const scope = $('follow', {}),
    {
      thinkyR,
      thinky,
      changes,
      get,
      isEmpty,
      type
    } = $,
    thisView = {};
  client.follow = thisView;
  if (!thinky.models.follow) {
    thinky.createModel('follow', {
      to: type.string()
        .required(),
      from: type.string()
        .required(),
      createdAt: type.date()
        .default(thinkyR.now())
    });
  }
  const model = thinky.models.follow;
  thisView.security = async function (request) {
    const {
      socket,
    } = request;
    return !get('account.id', socket);
  };
  const changeFeed = await changes({
    table: 'follow',
    change(socket, oldVal, newVal) {
      socket.push('follow.update', {
        item: newVal
      });
    },
    remove(socket, oldVal) {
      socket.push('follow.delete', {
        item: oldVal
      });
    },
    add(socket, oldVal, newVal) {
      socket.push('follow.create', {
        item: newVal
      });
    },
    filter(oldVal, newVal) {
      const idTo = (!newVal) ? oldVal.to : newVal.to,
        idFrom = (!newVal) ? oldVal.from : newVal.from;
      return [this.watchers[idTo], this.watchers[idFrom]];
    }
  });
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
  thisView.create = async function (request) {
    const {
      body,
      socket,
    } = request;
    const checkStatus = await thinkyR.table('follow')
      .filter({
        from: socket.account.id,
        to: body.item.to
      });
    if (!isEmpty(checkStatus)) {
      return;
    }
    const newFriend = new model({
      from: socket.account.id,
      to: body.item.to,
    });
    await newFriend.save();
  };
  thisView.delete = async function (request) {
    const {
      body,
      socket,
    } = request;
    await thinkyR.table('follow')
      .filter({
        id: body.item.id,
        from: socket.account.id,
        to: body.item.to
      })
      .delete()
      .run();
  };
  thisView.to = async function (request) {
    const {
      response,
      body,
      socket,
    } = request;
    const page = (get('data.page', body)) ? body.data.page : 0;
    const skip = page * 25;
    const results = await thinkyR.table('follow')
      .filter((doc) => {
        return doc('from')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(1)
            .or(doc('status')
              .eq(0)));
      })
      .eqJoin('to', thinkyR.table('user'))
      .zip()
      .pluck(['id', 'username', 'to', 'from', 'username', 'sent', 'status'])
      .skip(skip)
      .limit(25)
      .run();
    console.log(results);
    response.data.items = results;
    response.data.page = page + 1;
    request.send();
  };
  thisView.from = async function (request) {
    const {
      response,
      body,
      socket,
    } = request;
    const page = (get('data.page', body)) ? body.data.page : 0;
    const skip = page * 25;
    const results = await thinkyR.table('follow')
      .filter((doc) => {
        return doc('to')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(1)
            .or(doc('status')
              .eq(0)));
      })
      .eqJoin('to', thinkyR.table('user'))
      .zip()
      .pluck(['id', 'username', 'to', 'from', 'username', 'sent', 'status'])
      .skip(skip)
      .limit(25)
      .run();
    console.log(results);
    response.data.items = results;
    response.data.page = page + 1;
    request.send();
  };
};
