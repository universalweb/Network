module.exports = async function ($, client) {
  /*
    0 - pending
    1 - accepted
    2 - declined
    3 - muted
  */
  const scope = $('friend', {}),
    {
      get,
      thinky,
      type,
      thinkyR
    } = $,
    thisView = {};
  client.friend = thisView;
  if (!thinky.models.friend) {
    thinky.createModel('friend', {
      status: type.number()
        .required(),
      from: type.string()
        .required(),
      to: type.string()
        .required(),
      sent: type.date()
        .default(thinkyR.now()),
    });
  }
  thisView.security = async function (request) {
    const {
      socket,
    } = request;
    console.log(get('account.id', socket), !get('account.id', socket));
    return !get('account.id', socket);
  };
  await require('./model')($, client);
  await require('./methods')($, client);
  await require('./reading')($, client);
  await require('./watch')($, client);
  await require('./online')($, client);
};
