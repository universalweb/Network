(async () => {
  const {
    utility: {
      cnsl,
    },
    start
  } = app;
  cnsl('Core Module', 'notify');
  start({
    port: 80,
    socketHostname: 'localhost',
  });
})();
