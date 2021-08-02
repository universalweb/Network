module.exports = async function ($, client) {
  const {
    system,
    directory,
    eachAsync
  } = app;
  const thinky = $.thinky = await require('thinky')(system.config.database);
  $.type = $.thinky.type;
  const thinkyR = $.thinkyR = thinky.r;
  const r = require('rethinkdb');
  const conn = await r.connect(system.config.database);
  $.r = r;
  $.conn = conn;
  $.uuidDB = (id) => {
    return thinkyR.uuid(id)
      .run();
  };
  await require('./startup/clean')($);
  await require('./startup/changes')($);
  const items = [];
  const models = await directory.shallowRequire(`${__dirname}/model`);
  items.push(...models);
  const views = await directory.shallowRequire(`${__dirname}/view`);
  items.push(...views);
  await eachAsync(items, async(item) => {
    if (item && item.module) {
      await item.module($, client);
    }
  });
};
