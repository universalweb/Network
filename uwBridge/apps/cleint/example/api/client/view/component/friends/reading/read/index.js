module.exports = async (app) => {
  const {
    thinkyR,
    api,
  } = app;
  const friendReadApi = {
    async read(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (body) ? body.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('friend')
        .orderBy({
          index: thinkyR.desc('sent'),
        })
        .filter((doc) => {
          return doc('to')
            .eq(socket.account.id)
            .and(doc('status')
              .eq(1));
        })
        .map((doc) => {
          return doc.merge({
            originalId: doc('id'),
          })
            .without('id');
        })
        .eqJoin('from', thinkyR.table('user'))
        .zip()
        .map((doc) => {
          return doc.merge({
            userId: doc('id'),
            id: doc('originalId'),
          });
        })
        .pluck([
          'id',
          'userId',
          'username',
          'to',
          'from',
          'sent',
          'status',
          'unreadMessages',
          'admin',
          'role',
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
  api.extend(friendReadApi, {
    prefix: 'friend',
  });
};
