module.exports = async (app) => {
  /*
    0 - pending
    1 - accepted
    2 - declined
    3 - muted
  */
  app.model.friend = {};
  const {
    thinky,
    type,
    thinkyR,
    api,
  } = app;
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
  const friendApi = {
    async security(request) {
      return request.socket.login;
    },
  };
  await require('./model')(app);
  await require('./methods')(app);
  await require('./reading')(app);
  await require('./watch')(app);
  await require('./online')(app);
  api.extend(friendApi, {
    prefix: 'friend',
  });
};
