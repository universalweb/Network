module.exports = async (app) => {
  const {
    config,
    utility: {
      shallowRequire,
      eachAsync
    }
  } = app;
  const thinky = await require('thinky')(config.database);
  const thinkyR = thinky.r;
  const r = require('rethinkdb');
  const conn = await r.connect(config.database);
  app.thinky = thinky;
  app.type = thinky.type;
  app.thinkyR = thinkyR;
  app.r = r;
  app.conn = conn;
  app.uuidDB = (id) => {
    return thinkyR.uuid(id)
      .run();
  };
  await require('./startup/clean')(app);
  await require('./startup/changes')(app);
  const views = await shallowRequire(`${__dirname}/view`);
  await eachAsync(views, async (item) => {
    if (item && item.module) {
      await item.module(app);
    }
  });
};
