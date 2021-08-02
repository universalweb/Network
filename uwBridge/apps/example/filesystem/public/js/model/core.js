(async function () {
  const { cnsl, menrvah } = app;
  cnsl('Core Module', 'notify');
  $.config = {
    port: 80,
    socketHostname: 'ws.tommarchi.com',
  };
  menrvah();
  $.start = performance.now();
})();
