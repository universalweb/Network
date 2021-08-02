(async function () {
  const {
    page
  } = app;
  exports.config = {
    data: {
      hero: {
        icon: 'assignment'
      }
    }
  };
  exports.compile = function () {
    return page.compile(exports);
  };
})();
