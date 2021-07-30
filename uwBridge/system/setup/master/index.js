module.exports = async (config) => {
  await require('../app')(Object.assign({
    masterMode: true
  }, config));
};
