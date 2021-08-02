(async function () {
  const {
    page
  } = app;
  exports.config = {
    data: {
      hero: {
        icon: 'mail',
      }
    }
  };
  exports.compile = function () {
    return page.compile(exports);
  };
})();
