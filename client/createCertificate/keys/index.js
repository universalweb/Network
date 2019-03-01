module.exports = async (state) => {
  const {
    crypto: {
      keypair,
      signKeypair,
      toBase64
    },
    utility: {
      assign,
      eachObjectAsync,
      omit
    },
    sign,
    file,
    logImprt,
    alert
  } = state;
  const stringify = require('json-stable-stringify');
  logImprt('Keys', __dirname);
  const api = {
    async save(certificate, directory) {
      await eachObjectAsync(certificate, async (value, key) => {
        await file.write(`${directory}/${key}.cert`, stringify(value.data));
      });
      const publicCertificate = stringify(assign({
        ephemeral: omit(certificate.ephemeral.data, 'private')
      }, omit(certificate.master.data, 'private')));
      await file.write(`${directory}/public.cert`, publicCertificate);
    },
    async create(directory, additionalEphemeral, additionalMaster) {
      const keypairs = {
        ephemeral: keypair(),
        master: signKeypair()
      };
      const certificates = api.build(keypairs, additionalEphemeral, additionalMaster);
      alert('Certificates Built');
      sign(certificates, keypairs);
      alert('Certificates Signed');
      api.buildPrivate(certificates, keypairs);
      alert('Private Certificates Created');
      if (directory) {
        await api.save(certificates, directory);
        alert(`Certificates Saved to ${directory}`);
      }
      return {
        keypairs,
        certificates
      };
    },
    build(keypairs, additionalEphemeral, additionalMaster) {
      const {
        master: {
          publicKey: masterKey,
        },
        ephemeral: {
          publicKey: ephemeralKey,
        },
      } = keypairs;
      const ephemeral = {
        data: assign({
          start: Date.now(),
          key: ephemeralKey.toString('base64')
        }, additionalEphemeral)
      };
      const master = {
        data: assign({
          start: Date.now(),
          key: masterKey.toString('base64')
        }, additionalMaster)
      };
      return {
        ephemeral,
        master
      };
    },
    buildPrivate(certificates, keypairs) {
      const {
        ephemeral: {
          secretKey: secretKeyEphemeral
        },
        master: {
          secretKey: secretKeyMaster
        }
      } = keypairs;
      const ephemeralPrivate = assign({}, certificates.ephemeral);
      const masterPrivate = assign({}, certificates.master);
      ephemeralPrivate.data.private = toBase64(secretKeyEphemeral);
      masterPrivate.data.private = toBase64(secretKeyMaster);
      certificates.ephemeralPrivate = ephemeralPrivate;
      certificates.masterPrivate = masterPrivate;
    }
  };
  state.api = api;
};
