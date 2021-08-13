module.exports = async (app) => {
  const {
    thinkyR,
    changes,
    each,
    assign,
    socketServer,
    api
  } = app;
  const scope = app.model.friend;
  const getUser = async (id, username, userStatus) => {
    if (!id || id === username) {
      return;
    }
    const user = await thinkyR.table('user')
      .get(id)
      .pluck('id', 'username', 'role', 'admin')
      .run();
    user.userId = user.id;
    if (username && userStatus) {
      const relationship = await scope.getSingleRelationship(id, username);
      if (relationship) {
        assign(user, relationship);
      }
    }
    return user;
  };
  await changes({
    table: 'group',
    async change(oldVal, newVal) {
      const item = await getUser(newVal.accountID, newVal.name, newVal.status);
      if (item) {
        item.online = true;
        item.group = newVal;
        socketServer.push('group.update', {
          item,
        }, (newVal.status) ? `${newVal.name}Private` : newVal.name);
      }
    },
    async remove(oldVal) {
      const item = await getUser(oldVal.accountID, oldVal.name, oldVal.status);
      if (item) {
        item.online = false;
        item.group = oldVal;
        socketServer.push('group.remove', {
          item,
        }, (oldVal.status) ? `${oldVal.name}Private` : oldVal.name);
      }
    },
    async add(newVal) {
      const item = await getUser(newVal.accountID, newVal.name, newVal.status);
      if (item) {
        item.online = true;
        item.group = newVal;
        socketServer.push('group.create', {
          item,
        }, (newVal.status) ? `${newVal.name}Private` : newVal.name);
      }
    },
  });
  const friendApi = {
    async announce(request) {
      const {
        socket,
      } = request;
      const results = await thinkyR.table('friend')
        .filter({
          from: socket.account.id,
          status: 1,
        })
        .eqJoin('to', thinkyR.table('group'), {
          index: 'name',
        })
        .zip()
        .run();
      each(results, (item) => {
        socket.joinGroup(item.name, true);
      });
    },
    async announceTo(request) {
      const {
        body,
        socket,
      } = request;
      console.log(body);
      const id = body.userId || body.id;
      if (socket.account.id === id) {
        return;
      }
      const results = await thinkyR.table('friend')
        .filter({
          from: socket.account.id,
          to: body.userId || body.id,
          status: 1,
        })
        .isEmpty()
        .run();
      console.log(results);
      if (!results) {
        socket.joinGroup(body.id, true);
      }
    },
    async online(request) {
      const {
        response,
        socket,
      } = request;
      const results = await thinkyR.table('group')
        .filter({
          name: socket.account.id,
        })
        .eqJoin('name', thinkyR.table('user'))
        .pluck('id', 'username', 'avatar', 'admin', 'role')
        .run();
      response.data.items = results;
    }
  };
  api.extend(friendApi, {
    prefix: 'friend',
  });
};
