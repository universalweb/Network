module.exports = async function ($) {
  const scope = $('friend'),
    {
      thinkyR,
      assign,
      isEmpty,
    } = app;
  assign(scope, {
    async getFriendInfo(id) {
      const results = await thinkyR.table('user')
        .get(id)
        .pluck(['id', 'username', 'admin', 'role'])
        .run();
      return results;
    },
    async getRelationship(id, socket) {
      const results = await thinkyR.table('friend')
        .filter(doc => doc('from')
          .eq(id)
          .and(doc('to')
            .eq(socket.account.id))
          .or(doc('from')
            .eq(socket.account.id)
            .and(doc('to')
              .eq(id))))
        .run();
      return results;
    },
    async updateRelationship(id, socket, updateObject) {
      const results = await thinkyR.table('friend')
        .filter(doc => doc('from')
          .eq(id)
          .and(doc('to')
            .eq(socket.account.id))
          .or(doc('from')
            .eq(socket.account.id)
            .and(doc('to')
              .eq(id))))
        .update(updateObject)
        .run();
      return results;
    },
    async updateSingleRelationship(from, to, updateObject) {
      const results = await thinkyR.table('friend')
        .filter({
          from,
          to,
        })
        .update(updateObject, {
          nonAtomic: true
        })
        .run();
      return results;
    },
    async getSingleRelationship(from, to) {
      const results = await thinkyR.table('friend')
        .filter({
          from,
          to,
        })
        .run();
      return results[0];
    },
    async hasRelationship(id, socket) {
      return !isEmpty(await scope.getRelationship(id, socket));
    },
    async updateMessageStat(from, to) {
      await scope.updateSingleRelationship(from, to, {
        unreadMessages: thinkyR.table('message')
          .filter({
            from,
            to,
            status: 0,
          })
          .count(),
      });
    },
    async updateStats(id) {
      const friends = await thinkyR.table('friend')
        .filter(doc => doc('from')
          .eq(id)
          .and(doc('status')
            .eq(1)))
        .count()
        .run();
      const pendingRecievedFriends = await thinkyR.table('friend')
        .filter(doc => doc('to')
          .eq(id)
          .and(doc('status')
            .eq(0)))
        .count()
        .run();
      const pendingSentFriends = await thinkyR.table('friend')
        .filter(doc => doc('from')
          .eq(id)
          .and(doc('status')
            .eq(0)))
        .count()
        .run();
      const updateObject = {
        friends,
        pendingRecievedFriends,
        pendingSentFriends,
      };
      $('stats')
        .update(id, updateObject);
    },
  });
};
