/*
  File for signing certificates
*/
(async () => {
  const state = {
    type: 'Certificate Signing',
    utility: require('Lucy')
  };
  await require('../console/')(state);
  await require('./certificate/')(state);
  await require('../crypto/')(state);
  await require('./sign/')(state);
  await require('./keys/')(state);
  const {
    api,
    crypto: {
      signOpen,
      toBuffer,
    },
    utility: {
      stringify
    },
    cnsl,
    warn,
    success,
    alert
  } = state;
  const certificates = await api.sign(__dirname, additionalEphemeral, additionalMaster);
})();
