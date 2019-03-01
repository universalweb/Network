module.exports = async (state) => {
  const liquid = {
    async stream(message) {
      console.log(message);
    },
    async 'stream.create'(message) {
      console.log(message);
    }
  };
  state.liquid = liquid;
};
