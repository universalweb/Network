module.exports = async function ($, client) {
  const scope = $('profile', {}),
    clientView = {};
  const {
    thinkyR,
    get,
    assign,
    isEmpty,
  } = app;
  client.profile = clientView;
  assign(scope, {
    async private(request) {
      const {
        body,
        response,
      } = request;
      const user = await thinkyR.table('user')
        .get(body.item.id)
        .pluck(['id', 'username', 'thumb', 'header', 'contact', 'social'])
        .run();
      response.data.profile = user;
    },
    async public(request) {
      const {
        body,
        response,
      } = request;
      const user = await thinkyR.table('user')
        .get(body.item.id)
        .pluck(['id', 'username', 'thumb', 'header'])
        .run();
      response.data.profile = user;
    },
    async personal(request) {
      const {
        response,
        socket,
      } = request;
      const user = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck(['id', 'username', 'thumb', 'header', 'email'])
        .run();
      response.data.profile = user;
      response.data.profile.personal = true;
    },
    async profile(request) {
      const {
        body,
        response,
        socket,
      } = request;
      if (!get('account.id', socket)) {
        await scope.public(request);
      } else {
        const userProfile = await thinkyR.table('user')
          .getAll(body.item.username, {
            index: 'username',
          })
          .pluck(['id'])
          .run();
        if (!isEmpty(userProfile)) {
          body.item.id = userProfile[0].id;
          if (body.item.id === socket.account.id) {
            await scope.personal(request);
            return;
          }
          const relationship = await thinkyR.table('friend')
            .filter(doc => doc('from')
              .eq(body.item.id)
              .and(doc('to')
                .eq(socket.account.id))
              .or(doc('to')
                .eq(body.item.id)
                .and(doc('from')
                  .eq(socket.account.id))))
            .run();
          const relationshipObject = relationship[0] || {};
          if (relationshipObject.status >= 0 && relationshipObject.status !== 3) {
            await scope.private(request);
          } else {
            await scope.public(request);
          }
          response.data.profile.userId = response.data.profile.id;
          response.data.profile.id = null;
          assign(response.data.profile, relationshipObject || {});
        }
      }
    },
  });
  assign(clientView, {
    async read(request) {
      const {
        body,
      } = request;
      if (body.item) {
        if (body.item.username) {
          await scope.profile(request);
        }
      } else {
        await scope.personal(request);
      }
      request.send();
    },
  });
};
