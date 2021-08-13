(async () => {
  console.log('coreComponents');
  const dirname = exports.dirname;
  const {
    demand,
    utility: {
      map
    }
  } = app;
  await demand(map(['icon', 'button', 'inputGroup', 'hero', 'menubar', 'toolbar', 'overlay'], (item) => {
    return `${dirname}${item}/`;
  }));
})();
