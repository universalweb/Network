(async function () {
  console.log('coreComponents');
  const dirname = exports._.dirname;
  const {
    map
  } = app;
  await demand(map(['icon', 'button', 'inputGroup', 'hero', 'menubar', 'toolbar', 'overlay'], (item) => {
    return `${dirname}${item}/`;
  }));
})();
