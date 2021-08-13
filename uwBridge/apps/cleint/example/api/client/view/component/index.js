module.exports = async (app) => {
  const {
    utility: {
      eachAsync,
      shallowRequire,
    }
  } = app;
  app.users = {};
  const models = await shallowRequire(`${__dirname}`);
  eachAsync(models, async (item) => {
    if (item && item.module) {
      await item.module(app);
    }
  });
};
