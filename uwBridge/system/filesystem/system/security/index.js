module.exports = async (app) => {
  const cryptoLib = require('crypto');
  const {
    system,
  } = app;
  const checksum = (str, algorithm, encoding) => {
    return cryptoLib.createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex');
  };
  system.security = {
    checksum,
  };
};
