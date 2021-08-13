(async () => {
  const {
    page
  } = app;
  exports.config = {
    data: {
      hero: {
        icon: 'mail',
        background: {
          color: 'pink',
          image: '/image/contact.jpg',
          position: 'center center',
          size: 'cover'
        }
      }
    }
  };
  exports.compile = () => {
    return page.compile(exports);
  };
})();
