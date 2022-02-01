(async () => {
  const {
    utility: {
      cnsl,
    },
    start
  } = app;
  cnsl('Core Module', 'notify');
  start({
    port: 443,
    socketHostname: 'betaws.menrvah.com',
  });
})();
