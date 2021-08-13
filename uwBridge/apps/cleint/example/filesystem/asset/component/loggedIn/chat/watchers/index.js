(async () => {
  const {
    demand,
    utility: {
      each
    }
  } = app;
  const dirname = exports.dirname;
  const importwatchers = await demand(`${dirname}friends/,${dirname}messages/`);
  exports.load = function(source) {
    const watchers = {};
    each(importwatchers, (item) => {
      item.load(source, watchers);
    });
    return watchers;
  };
})();
