(async () => {
  const {
    page
  } = app;
  exports.config = {
    data: {
      hero: {
        icon: 'assignment',
        color: 'amber',
      }
    }
  };
  exports.compile = () => {
    return page.compile(exports);
  };
})();
