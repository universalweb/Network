module.exports = (app) => {
  app.model.follow = {};
  const {
    thinkyR,
    thinky,
    api,
    get,
    isEmpty,
    type,
  } = app;
  if (!thinky.models.follow) {
    thinky.createModel('follow', {
      to: type.string()
        .required(),
      from: type.string()
        .required(),
      createdAt: type.date()
        .default(thinkyR.now()),
    });
  }
  const FollowScheme = thinky.models.follow;
  const followApi = {
    async security(request) {
      return request.socket.login;
    },
    async create(request) {
      const {
        body,
        socket,
      } = request;
      const checkStatus = await thinkyR.table('follow')
        .filter({
          from: socket.account.id,
          to: body.item.to,
        });
      if (!isEmpty(checkStatus)) {
        return;
      }
      const newFriend = new FollowScheme({
        from: socket.account.id,
        to: body.item.to,
      });
      await newFriend.save();
    },
    async delete(request) {
      const {
        body,
        socket,
      } = request;
      await thinkyR.table('follow')
        .filter({
          id: body.item.id,
          from: socket.account.id,
          to: body.item.to,
        })
        .delete()
        .run();
    },
    async to(request) {
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
    },
    async from(request) {
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
    },
  };
  api.extend(followApi, {
    prefix: 'analytic',
  });
};
