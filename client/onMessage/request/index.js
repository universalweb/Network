module.exports = async (state) => {
  await require('./requests')(state);
  const {
    send,
    logImprt,
    cnsl,
    requests,
    utility: {
      uid,
      promise,
      uid: {
        free
      }
    },
  } = state;
  logImprt('Request', __dirname);
  async function request(api, body) {
    cnsl(`Requested ${api}`);
    const rid = uid();
    const message = {
      api,
      rid,
      body
    };
    await send(message);
    return promise((accept) => {
      requests.set(rid, (bodyResponse, json, streamID) => {
        accept([bodyResponse, json, streamID]);
        free(rid);
      });
    });
  }
  state.request = request;
};
