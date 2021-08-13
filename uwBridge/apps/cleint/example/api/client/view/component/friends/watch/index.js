module.exports = async (app) => {
  const scope = app.model.friend;
  const {
    users,
    changes,
    utility: {
      assign,
    }
  } = app;
  await changes({
    table: 'friend',
    async change(oldVal, newVal) {
      if (newVal.status !== 1) {
        return;
      }
      const to = users[newVal.to];
      const from = users[newVal.from];
      const user = await scope.getFriendInfo(newVal.from);
      user.userId = user.id;
      assign(user, newVal);
      if (to) {
        to.joinGroup(newVal.from);
        await scope.updateStats(newVal.to);
        to.push('friend.update', {
          item: user
        });
      }
      if (from) {
        from.joinGroup(newVal.to);
        await scope.updateStats(newVal.from);
        from.push('friend.update', {
          item: user
        });
      }
    },
    async remove(oldVal) {
      const to = users[oldVal.to];
      const from = users[oldVal.from];
      if (to) {
        to.leaveGroup(oldVal.from);
        await scope.updateStats(oldVal.to);
        to.push('friend.remove', {
          item: oldVal
        });
      }
      if (from) {
        from.leaveGroup(oldVal.to);
        await scope.updateStats(oldVal.from);
        to.push('friend.remove', {
          item: oldVal
        });
      }
    },
    async add(newVal) {
      if (newVal.status !== 1) {
        return;
      }
      const to = users[newVal.to];
      const from = users[newVal.from];
      const user = await scope.getFriendInfo(newVal.from);
      user.userId = user.id;
      assign(user, newVal);
      if (to) {
        to.joinGroup(newVal.from);
        await scope.updateStats(newVal.to);
        to.push('friend.create', {
          item: user
        });
      }
      if (from) {
        from.joinGroup(newVal.to);
        await scope.updateStats(newVal.from);
        from.push('friend.create', {
          item: user
        });
      }
    }
  });
};
