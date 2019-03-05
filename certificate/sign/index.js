module.exports = (state) => {
  const {
    crypto: {
      toBase64,
      hashSign,
      buff
    },
    utility: {
      assign,
    },
    logImprt
  } = state;
  logImprt('Sign', __dirname);
  const stringify = require('json-stable-stringify');
  const api = {
    sign(certificate, authority) {
      const signatureMaster = buff(stringify(certificate));
      return toBase64(hashSign(signatureMaster, authority.secretKey));
    },
  };
  assign(state.certificate, api);
};
