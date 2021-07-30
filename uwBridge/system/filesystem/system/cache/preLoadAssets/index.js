module.exports = async (app) => {
  const {
    config,
    utility: {
      promise,
      initialString
    }
  } = app;
  const resourceDir = `${initialString(config.resourceDir)}`;
  const walk = require('walk');
  const files = [];
  await promise((accept) => {
    const walker = walk.walk(resourceDir, {
      followLinks: false
    });
    walker.on('file', (rootPath, stat, next) => {
      files.push(`${rootPath}/${stat.name}`);
      return next();
    });
    walker.on('end', () => {
      return accept();
    });
  });
  return files;
};
