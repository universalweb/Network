(async function () {
  const { each } = app;
  const dirname = exports._.dirname;
  const importPipes = await demand(`${dirname}friends/,${dirname}messages/`);
  exports.load = function (self) {
    const pipes = {};
    each(importPipes, (item) => {
      item.load(self, pipes);
    });
    return pipes;
  };
})();
