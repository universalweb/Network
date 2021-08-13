(async () => {
  const dirname = exports.dirname;
  const {
    demand,
    utility: {
      map
    },
  } = app;
  await demand(map([
    'watch',
    'notifications',
    'chat',
    'friends',
    'accounts'
  ], (item) => {
    return `${dirname}${item}/`;
  }));
})();
