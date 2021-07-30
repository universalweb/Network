module.exports = async (utility) => {
  require('./directory')(utility);
  const {
    map,
    shallowRequire
  } = utility;
  const plugins = await shallowRequire(__dirname);
  map(plugins, (item) => {
    item.module(utility);
  });
};
