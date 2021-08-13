module.exports = async (app) => {
  const scope = {};
  app.model.admin = scope;
  const adminApi = {
    async security(request) {
      return request.socket.login;
    }
  };
  await require('./notify')(app);
};
