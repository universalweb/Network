module.exports = (state) => {
  const {
    crypto: {
      toBase64,
      hashSign,
      buff
    },
    logImprt
  } = state;
  logImprt('Sign', __dirname);
  const stringify = require('json-stable-stringify');
  async function sign(certificates, keypairs, authority) {
    const secretKey = keypairs.master.secretKey;
    const dataEphemeral = buff(stringify(certificates.ephemeral.data));
    certificates.ephemeral.signature = toBase64(hashSign(dataEphemeral, secretKey));
    certificates.ephemeral.data.signature = certificates.ephemeral.signature;
    if (authority) {
      const dataEphemeralPrint = buff(stringify(certificates.ephemeral.data));
      certificates.ephemeral.print = toBase64(hashSign(dataEphemeralPrint, authority.secretKey));
      certificates.ephemeral.data.print = certificates.ephemeral.print;
      const signatureMaster = buff(stringify(certificates.master.data));
      certificates.master.signature = toBase64(hashSign(signatureMaster, authority.secretKey));
      certificates.master.data.signature = certificates.master.signature;
    }
  }
  state.sign = sign;
};
