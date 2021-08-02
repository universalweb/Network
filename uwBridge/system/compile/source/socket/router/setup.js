import app from '../app';
const {
  demandJs,
  demandLang,
  componentMethods,
  utility: {
    cnsl,
    assign,
    each,
    map,
    isString,
    rest,
    camelCase,
    omit,
    last,
    batch,
    eventAdd,
    has,
    whileArray,
  },
} = app;
const ractive = window.Ractive;
const router = {};
const hostname = window.location.hostname;
const origin = window.location.origin;
cnsl('ROUTER ONLINE', 'important');
assign(router, {
  add(item) {
    each(item, router.addObject);
  },
  addObject(item, key) {
    const reg = new RegExp(key);
    router.routes.push(() => {
      return router.routeChecker(item, reg);
    });
  },
  attachEvents() {
    eventAdd(window, 'popstate', (eventArg) => {
      router.saveState();
      router.updateLocation();
      router.loadState();
      eventArg.preventDefault();
    }, true);
  },
  closeState(previousStateObject) {
    if (previousStateObject) {
      if (!previousStateObject.closed) {
        router.forceClose(previousStateObject);
      }
    }
  },
  forceClose(sourceState) {
    app.view.set('navState', false);
    const nullCurrentState = Boolean(sourceState);
    const currentStateObject = sourceState || router.currentStateObject;
    if (currentStateObject) {
      if (router.currentStateObject.watchers) {
        router.currentStateObject.watchers.stop();
      }
      currentStateObject.closed = true;
      if (currentStateObject.close) {
        batch(currentStateObject.close);
      }
      if (nullCurrentState) {
        router.currentStateObject = null;
      }
    }
  },
  go(route) {
    router.openState(route);
    if (router.analytics) {
      router.analytics();
    }
  },
  isCurrentModel(model, success, failure) {
    const check = (router.currentStateObject) ? router.currentStateObject === model : false;
    if (check) {
      if (success) {
        success();
      }
    } else if (failure) {
      failure();
    }
    return check;
  },
  loadState() {
    cnsl('Router Loading State', 'notify');
    whileArray(router.routes, (item) => {
      return Boolean(item()) === false;
    });
  },
  location: {
    previous: {},
  },
  objectRoutes: {},
  openState(openModel) {
    // close event
    const previousStateObject = router.currentStateObject;
    if (openModel) {
      router.currentStateObject = openModel;
      if (!openModel.panel) {
        router.closeState(previousStateObject);
      }
      if (openModel.closed || openModel.closed === undefined) {
        if (openModel.open) {
          batch(openModel.open);
        }
        openModel.closed = false;
      }
    } else {
      router.currentStateObject = null;
      router.closeState(previousStateObject);
    }
    if (router.currentStateObject && router.currentStateObject.component) {
      (async () => {
        await app.view.set('navState', false);
        ractive.components.navState = router.currentStateObject.component;
        await app.view.set('navState', true);
        if (router.currentStateObject.watchers) {
          router.currentStateObject.watchers.start();
        }
      })();
    }
  },
  async pushState(url) {
    if (url) {
      await router.saveState();
      await router.setState(url, url);
      await router.updateLocation();
      await router.loadState();
    }
  },
  reloadState(sourceState) {
    const currentStateObject = sourceState || router.currentStateObject;
    if (currentStateObject) {
      if (currentStateObject.reload) {
        batch(currentStateObject.reload);
      }
    }
  },
  routeChecker(data, reg) {
    const matching = router.location.pathname.match(reg);
    console.log(router.location.pathname, matching, reg);
    if (matching) {
      router.match = matching;
      const route = data.route();
      let routePath = (last(route.path) === '/') ? route.path : `${route.path}/`;
      routePath = (routePath[0] === '/') ? routePath : `/${routePath}`;
      route.path = routePath;
      const routeRequire = data.require;
      if (router.objectRoutes[routePath]) {
        router.go(router.objectRoutes[routePath]);
      } else {
        (async () => {
          if (!data.loaded && routeRequire) {
            await demandJs(routeRequire);
          }
          const object = await demandJs(`routes${routePath}`);
          const lang = await demandLang(routePath);
          if (object.component && object.component.then) {
            await object.component;
          }
          object.assets = object.assets || {};
          if (lang) {
            object.assets.language = lang;
          }
          if (object.compile) {
            await object.compile();
          }
          router.objectRoutes[routePath] = object;
          router.go(object);
          data.loaded = true;
        })();
      }
    }
    return matching;
  },
  routes: [],
  saveState() {
    assign(router.location.previous, omit(router.location, ['previous']));
  },
  setState(url, title, object) {
    // pushState
    if (hostname + url === hostname + window.location.pathname) {
      router.reloadState();
    } else {
      history.pushState(object, title, url);
    }
  },
  setup() {
    router.updateLocation();
    router.attachEvents();
    router.loadState();
  },
  updateLocation() {
    map(top.location, (item, index) => {
      if (isString(item)) {
        router.location[index] = item;
      }
    });
    router.location.pathScored = router.location.pathname.replace(/\//g, '_');
    router.location.paths = rest(router.location.pathname.split('/'));
    router.location.pathCamel = camelCase(router.location.paths.join('_'));
  }
});
componentMethods.routerLoad = (componentView) => {
  componentView.on({
    routerBack() {
      if (router.location.previous.hostname) {
        window.history.back();
      } else {
        router.pushState('/');
      }
    },
    routerForward() {
      if (router.location.previous.hostname) {
        window.history.forward();
      } else {
        router.pushState('/');
      }
    },
    routerLoad(eventArg) {
      const href = eventArg.node.href;
      const node = event.node;
      if (!href) {
        router.pushState(event.get('href') || node.getAttribute('data-href'));
      } else if (has(href, origin) || has(href, hostname)) {
        event.preventDefault();
        router.pushState(node.getAttribute('href'));
      }
      return false;
    },
  });
};
assign(app, {
  router,
});
