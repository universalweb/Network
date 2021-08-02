module.exports = async function ($, client) {
  const {
    eachAsync,
    directory,
  } = app;
  const models = await directory.shallowRequire(`${__dirname}`);
  eachAsync(models, async (item) => {
    if (item && item.module) {
      await item.module($, client);
    }
  });
};
