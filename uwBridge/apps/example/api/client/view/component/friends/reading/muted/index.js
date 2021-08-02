module.exports = async function ($, client) {
  const {
    thinkyR,
    assign,
    get,
  } = app;
  const scope = $('friend');
  const thisView = client.friend;
  assign(thisView, {
    async muted(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (get('page', body)) ? body.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('friend')
        .orderBy({
          index: thinkyR.desc('sent'),
        })
        .filter(doc => doc('to')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(3)))
        .map(doc => doc.merge({
          originalId: doc('id'),
        })
          .without('id'))
        .eqJoin('from', thinkyR.table('user'))
        .zip()
        .map(doc => doc.merge({
          userId: doc('id'),
          id: doc('originalId'),
        }))
        .pluck([
          'id',
          'userId',
          'username',
          'to',
          'from',
          'sent',
          'status',
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
    async search(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (get('page', body)) ? body.page : 0;
      const skip = page * 25;
      const search = body.search.trim();
      const results = await thinkyR.table('friend')
        .orderBy({
          index: thinkyR.desc('sent'),
        })
        .filter(doc => doc('to')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(1)))
        .filter(doc => thinkyR.table('user').get(doc('from'))('username').match(`(?i)${search}`))
        .map(doc => doc.merge({
          originalId: doc('id'),
        })
          .without('id'))
        .eqJoin('from', thinkyR.table('user'))
        .zip()
        .map(doc => doc.merge({
          userId: doc('id'),
          id: doc('originalId'),
        }))
        .pluck([
          'id',
          'userId',
          'username',
          'to',
          'from',
          'sent',
          'status',
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
    async pending(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (get('page', body)) ? body.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('friend')
        .orderBy({
          index: thinkyR.desc('sent'),
        })
        .filter(doc => doc('to')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(0)))
        .map(doc => doc.merge({
          originalId: doc('id'),
        })
          .without('id'))
        .eqJoin('from', thinkyR.table('user'))
        .zip()
        .map(doc => doc.merge({
          userId: doc('id'),
          id: doc('originalId'),
        }))
        .pluck([
          'id',
          'userId',
          'username',
          'to',
          'from',
          'sent',
          'status',
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
    async read(request) {
      const {
        response,
        body,
        socket,
      } = request;
      const page = (get('page', body)) ? body.page : 0;
      const skip = page * 25;
      const results = await thinkyR.table('friend')
        .orderBy({
          index: thinkyR.desc('sent'),
        })
        .filter(doc => doc('to')
          .eq(socket.account.id)
          .and(doc('status')
            .eq(1)))
        .map(doc => doc.merge({
          originalId: doc('id'),
        })
        .without('id'))
        .eqJoin('from', thinkyR.table('user'))
        .zip()
        .map(doc => doc.merge({
          userId: doc('id'),
          id: doc('originalId'),
        }))
        .pluck([
          'id',
          'userId',
          'username',
          'to',
          'from',
          'sent',
          'status',
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
  });
};
