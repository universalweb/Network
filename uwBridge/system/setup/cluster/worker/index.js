module.exports = () => {
  process.on('message', (msg) => {
    console.log('Master to worker: ', msg);
  });
};
