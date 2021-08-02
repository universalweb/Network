module.exports = async function ($, client) {
  const scope = $('friend'),
    {
      changes,
      assign,
    } = $,
    thisView = client.friend;
  const changeFeed = await changes({
    table: 'friend',
    security: thisView.security,
    async change(socket, oldVal, newVal) {
      const user = await scope.getFriendInfo(newVal.from);
      user.userId = user.id;
      socket.push('friend.update', {
        item: assign(user, newVal),
      });
      if (newVal.status === 1) {
        const to = this.watchers[newVal.to];
        const from = this.watchers[newVal.from];
        if (to) {
          to.joinGroup(newVal.from);
        }
        if (from) {
          from.joinGroup(newVal.to);
        }
      }
    },
    async remove(socket, oldVal) {
      const user = await scope.getFriendInfo(oldVal.from);
      user.userId = user.id;
      socket.push('friend.delete', {
        item: assign(user, oldVal),
      });
      const to = this.watchers[oldVal.to];
      const from = this.watchers[oldVal.from];
      if (to) {
        to.leaveGroup(oldVal.from);
      }
      if (from) {
        from.leaveGroup(oldVal.to);
      }
    },
    async add(socket, oldVal, newVal) {
      const user = await scope.getFriendInfo(newVal.from);
      user.userId = user.id;
      socket.push('friend.create', {
        item: assign(user, newVal),
      });
    },
    async filter(oldVal, newVal) {
      const idTo = (!newVal) ? oldVal.to : newVal.to;
      const basic = newVal || oldVal;
      await scope.updateStats(basic.from);
      await scope.updateStats(basic.to);
      return [this.watchers[idTo]];
    },
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
};
