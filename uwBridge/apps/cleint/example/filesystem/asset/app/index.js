(async () => {
  const {
    demandCss,
    importComponent,
    router,
    view,
    utility: {
      cnsl,
      map
    }
  } = app;
  cnsl('App Module', 'important');
  await view.set({
    classes: {},
    logo: {
      motto: 'By Arity',
      title: 'Hermes',
    },
    pageTitle: 'Hermes',
  });
  await demandCss(map(['blotr', 'flexbox', 'theme', 'animation'], (item) => {
    return `css/core/${item}`;
  }), {
    appendCSS: true
  });
  import 'css/tour/arrows.css';
  import 'app/nwjs/';
  import 'js/lib/tether';
  import 'js/lib/tour';
  import 'routes/';
  import 'js/util/';
  import 'js/lib/plugins/fly';
  import 'js/action/nodeOpen/';
  import 'js/action/login';
  import 'app/watchers/';
  await app.render();
  import 'component/base/';
  await importComponent('layout', 'component/layout/', 'main');
  await importComponent('navigationbar', 'component/navigationBar/');
  await importComponent('sidebar', 'component/sidebar/');
  router.setup();
})();
