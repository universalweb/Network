module.exports = (async () => {
  const server = await require('./server')();
  console.log('Server Status', server.status);
  const client = await require('./client')();
  await require('./client/simulate')(client);
})();
