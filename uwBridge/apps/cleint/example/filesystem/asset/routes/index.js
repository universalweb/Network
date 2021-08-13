(async () => {
  import 'js/action/geoLocation';
  console.log('app router Module');
  const {
    router,
    push,
    view,
    utility: {
      cnsl
    }
  } = app;
  router.analytics = () => {
    push('analytic.view', {
      item: router.location,
      type: 'route',
    });
  };
  router.add({
    '/@': {
      route() {
        return {
          path: `user/profile/`,
        };
      }
    },
    '/network/': {
      require: ['component/page/'],
      route() {
        return {
          path: `auth${router.location.pathname}`,
        };
      }
    },
    '/team/': {
      route() {
        return {
          path: router.location.pathname,
        };
      }
    },
    '/user/': {
      route() {
        return {
          path: router.location.pathname,
        };
      }
    },
    '^/$': {
      require: ['component/page/'],
      route() {
        cnsl(router.location.pathname, 'notify');
        return view.get('loginStatus') ? {
          path: 'auth/network',
        } : {
          path: 'page/login',
        };
      }
    },
    '^/market/$': {
      require: ['component/page/'],
      route() {
        cnsl(router.location.pathname, 'notify');
        return {
          path: router.location.pathname,
        };
      }
    },
    '^/page/': {
      require: ['component/page/'],
      route() {
        cnsl(router.location.pathname, 'notify');
        return {
          path: router.location.pathname,
        };
      }
    }
  });
})();
