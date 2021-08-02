(async function () {
  const dirname = exports._.dirname;
  const {
    map
  } = app;
  await demand(map(['watch', 'notifications', 'friends', 'chat'], (item) => {
    return `${dirname}${item}/`;
  }));
})();
