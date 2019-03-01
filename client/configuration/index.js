module.exports = async (state) => {
  state.logImprt('SERVER CONFIGURATION', __dirname);
  state.configuration = {
    ip: '127.0.0.1',
    port: 8080,
    maxMTU: 1000,
    encoding: 'utf8',
    max: 1000
  };
};
