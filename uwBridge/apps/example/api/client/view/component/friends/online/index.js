module.exports = async function ($, client) {
  const scope = $('friend'),
    {
      thinkyR,
      changes,
      isEmpty,
      each,
      assign,
    } = $,
    thisView = client.friend;
  const getUser = async (id, socket) => {
    const user = await thinkyR.table('user')
      .get(id)
      .pluck('id', 'username', 'role', 'admin')
      .run();
    user.userId = user.id;
    if (socket.account) {
      const accountID = socket.account.id;
      if (id !== accountID) {
        const relationship = await scope.getSingleRelationship(id, accountID);
        assign(user, relationship);
      }
    }
    return user;
  };
  const changeFeed = await changes({
    table: 'group',
    security: thisView.security,
    async change(socket, oldVal, newVal) {
      const result = await getUser(newVal.accountID, socket);
      socket.push('group.update', {
        item: result,
      });
    },
    async remove(socket, oldVal) {
      const result = await getUser(oldVal.accountID, socket);
      socket.push('group.delete', {
        item: result,
      });
    },
    async add(socket, oldVal, newVal) {
      const result = await getUser(newVal.accountID, socket);
      socket.push('group.create', {
        item: result,
      });
    },
    filter(oldVal, newVal) {
      const idTo = (newVal) ? newVal.name : oldVal.name;
      return this.watchers[idTo];
    },
  });
  thisView.watchOnline = function (request) {
    const {
      socket,
    } = request;
    changeFeed.watch(socket.account.id, socket, true);
  };
  thisView.unwatchOnline = function (request) {
    const {
      socket,
    } = request;
    changeFeed.unwatch(socket.account.id, socket);
  };
  thisView.announce = async function (request) {
    const {
      socket,
    } = request;
    const results = await thinkyR.table('friend')
      .filter({
        from: socket.account.id,
        status: 1,
      })
      .eqJoin('to', thinkyR.table('user'))
      .run();
    each(results, (item) => {
      socket.joinGroup(item.right.id);
    });
  };
  thisView.announceTo = async function (request) {
    const {
      body,
      socket,
    } = request;
    console.log(body);
    const results = await thinkyR.table('friend')
      .filter({
        from: socket.account.id,
        to: body.userId || body.id,
        status: 1,
      })
      .run();
    if (!isEmpty(results)) {
      socket.joinGroup(body.id);
    }
  };
  thisView.online = async function (request) {
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
  };
};
