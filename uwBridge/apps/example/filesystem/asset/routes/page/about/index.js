(async function () {
  const {
    page
  } = app;
  exports.config = {
    data: {
      hero: {
        icon: 'info',
        background: {
          image: '/image/about.jpg',
          position: 'left center',
          size: 'cover'
        }
      }
    }
  };
  exports.compile = function () {
    return page.compile(exports);
  };
})();
