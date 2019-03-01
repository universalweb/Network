module.exports = async (state) => {
  const {
    logImprt,
    profile: {
      activate: activateProfile
    },
  } = state;
  logImprt('Simulation', __dirname);
  await activateProfile('tom');
  const {
    api: {
      connect
    }
  } = state;
  await connect();
  /*
    Utilize this for ensuring message delivery on every request based message.
    Push based messages require a response.
    eid is a emit ID.
    const {
      emit,
      logImprt,
    } = state;
    let count = 0;
    for (let i = 0; i < 10000; i++) {
      await emit('intro', {
        certificate: ''
      });
      count++;
    }
    alert(count);
  */
};
