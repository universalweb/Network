(async () => {
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
  exports.compile = () => {
    return page.compile(exports);
  };
})();
