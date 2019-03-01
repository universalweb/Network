module.exports = async (state) => {
  const {
    certificate: {
      get
    },
    certLog,
    logImprt
  } = state;
  logImprt('Core Certificates', __dirname);
  state.certificates.sentivate = await get(`${__dirname}/../sentivate.cert`, true);
  state.certificates.active = state.certificates.sentivate;
  certLog(`Sentivate - SIGNATURE:${state.certificates.sentivate.signature}`);
};
