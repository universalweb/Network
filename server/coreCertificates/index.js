module.exports = async (state) => {
  const {
    certificate: {
      get
    },
    logImprt
  } = state;
  logImprt('Core Certificates', __dirname);
  state.certificates = {
    sentivate: await get(`${__dirname}/../sentivate.cert`, true),
    active: {
      ephemeral: await get(`${__dirname}/../ephemeralPrivate.cert`, true),
      master: await get(`${__dirname}/../masterPrivate.cert`, true)
    }
  };
};
