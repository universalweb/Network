module.exports = async (state) => {
  const {
    request,
    utility: {
      stringify,
      omit,
    },
    alert,
    profiles,
  } = state;
  state.api = {
    async connect() {
      const result = await request('intro', {
        time: Date.now()
      });
      alert(stringify(result));
    }
  };
};
