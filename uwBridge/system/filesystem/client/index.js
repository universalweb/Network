module.exports = async (app) => {
  const {
    utility: {
      watch,
    },
    config
  } = app;
  require('./api')(app);
  require('./resource')(app);
  watch(config.apiClientDir, async (filename) => {
    console.log(filename);
    if (filename.includes('.')) {
      console.log(`${filename} Client Updated`);
      const importThis = filename.replace('/index.js', '');
      if (require.cache[require.resolve(importThis)]) {
        Reflect.deleteProperty(require.cache, require.resolve(importThis));
      }
      const moduleImported = require(importThis);
      if (moduleImported) {
        moduleImported(app);
      }
    }
  });
  await require(config.apiClientDir)(app);
};