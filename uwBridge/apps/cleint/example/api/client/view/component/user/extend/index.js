module.exports = async (app) => {
  const {
    utility: {
      eachAsync,
      shallowRequire
    }
  } = app;
  const models = await shallowRequire(`${__dirname}`);
  await eachAsync(models, async (item) => {
    if (item && item.module) {
      await item.module(app);
    }
  });
};
