(async function () {
  cnsl('app router Module');
  const {
    router,
  } = app;
  router.add('^/$', {
    require: ['component/page/'],
    route() {
      return {
        path: 'page/about/',
      };
    }
  });
  router.add('^/page/', {
    require: ['component/page/'],
    route() {
      return {
        path: router.location.pathname,
        language: true
      };
    }
  });
})();
