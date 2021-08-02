module.exports = function ($, client) {
  const scope = {},
    {
      view,
      thinkyR,
      assign,
      omit
    } = $,
    thisView = scope.view = client.analytic = view.analytic = {};
  thisView.view = async function (request) {
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
        ip: (!socket.account) ? socket.ip : null,
        requestHeaders: (!socket.account) ? socket.request.headers : null,
        accountID: (socket.account) ? socket.account.id : false,
        credit: (socket.credit) ? socket.credit.id : false,
        created: thinkyR.now()
      }))
      .run();
  };
  thisView.get = async function (request) {
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
  };
};
