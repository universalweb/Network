module.exports = (app) => {
  const {
    api,
    thinkyR,
    utility: {
      assign,
      omit,
    },
  } = app;
  const analyticApi = {
    async view(request) {
      const {
        body,
        socket,
      } = request;
      if (body.id) {
        return;
      }
      const cleaned = omit(body, ['id']);
      await thinkyR.table('analytics')
        .insert(assign(cleaned, {
          ip: (socket.account) ? null : socket.ip,
          requestHeaders: (socket.account) ? null : socket.request.headers,
          accountID: (socket.account) ? socket.account.id : false,
          credit: (socket.credit) ? socket.credit.id : false,
          created: thinkyR.now()
        }))
        .run();
    },
    async get(request) {
      const {
        body,
        response,
        socket,
      } = request;
      if (body.id) {
        return;
      }
      const cleaned = omit(body, ['id', 'credit']);
      const doc = await thinkyR.table('analytics')
        .filter(assign(cleaned, {
          accountID: (socket.account) ? socket.account.id : false,
        }))
        .run();
      response.data.value = doc;
    }
  };
  api.extend(analyticApi, {
    prefix: 'analytic'
  });
};
