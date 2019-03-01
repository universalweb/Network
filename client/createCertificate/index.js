/*
  File for generating a root certificates for the root Identity Registrar servers.
  Identity Registrar servers provide client certificates that are locked to a specific verified universal messenger account.
*/
(async () => {
  const state = {
    utility: require('Lucy'),
    type: 'Client Certificate'
  };
  await require('../../console/')(state);
  await require('../file/')(state);
  await require('../../crypto/')(state);
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
  const additionalEphemeral = {
    version: 1,
    algo: 'default',
    end: Date.now() + 100000000000,
  };
  const additionalMaster = {
    version: 1,
    algo: 'default',
    country: 'US',
    contact: 'tom@sentivate.com',
    end: Date.now() + 100000000000,
  };
  const certificates = await api.create(__dirname, additionalEphemeral, additionalMaster);
  const ephemeral = certificates.certificates.ephemeral;
  const master = certificates.certificates.master;
  cnsl('------------EPHEMERAL KEY------------');
  const bufferedSignature = toBuffer(ephemeral.signature);
  const signature = signOpen(bufferedSignature, certificates.keypairs.master.publicKey);
  if (signature) {
    success('Ephemeral Signature is valid');
  }
  alert('Ephemeral Certificate', ephemeral.data, `SIZE: ${stringify(ephemeral).length}bytes`);
  cnsl('------------MASTER KEY------------');
  alert('Master Certificate', master.data, `SIZE: ${stringify(master).length}bytes`);
  cnsl('------------TOTAL KEYPAIR SIZE------------');
  warn(`SIZE: ${stringify(ephemeral.data).length + stringify(master).length}bytes`);
})();
