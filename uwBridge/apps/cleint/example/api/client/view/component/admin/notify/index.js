module.exports = async (app) => {
  const scope = app.model.admin;
  const thisView = {
    all(request) {
      const {
        body,
      } = request;
      scope.create(body.item);
    },
  };
};
