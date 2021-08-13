(function () {
(function() {
  'use strict';

  const app = window.app;

  const security = {
    clear() {
      console.log('Cleanup');
    }
  };
  security.clear();
  app.security = security;

  const {utility: {debounce, eventAdd, isAgent, info, model}, view} = app;
  const updateResize = debounce(() => {
    app.view.set('bodyHeight', info.bodyHeight);
    app.view.set('bodyWidth', info.bodyWidth);
    app.view.set('windowHeight', info.windowHeight);
    app.view.set('windowWidth', info.windowWidth);
    const width = info.windowWidth;
    let screenSize;
    if (isAgent.mobile) {
      screenSize = 'mobileScreen';
    } else if (width < 1024) {
      screenSize = 'smallScreen';
    } else if (width < 1920) {
      screenSize = 'mediumScreen';
    } else if (width < 3000) {
      screenSize = 'hdScreen';
    } else if (width > 3000) {
      screenSize = '4kScreen';
    }
    console.log(screenSize);
    app.view.set('screenSize', screenSize);
  }, 250);
  eventAdd(window, 'resize', () => {
    requestAnimationFrame(updateResize);
  }, true);
  updateResize();
  const smoothScroll = (element, to, duration) => {
    if (duration <= 0) {
      return;
    }
    const difference = to - element.scrollTop;
    const perTick = difference / duration * 10;
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop === to) {
        return;
      }
      smoothScroll(element, to, duration - 10);
    });
  };
  model('smoothScroll', smoothScroll);

  window.Ractive.prototype.data = {
    $: app.utility,
    getComponent(partialName) {
      const componentName = partialName;
      const partial = `<${partialName} />`;
      console.log(componentName);
      const partialsCheck = Boolean(this.partials[partialName]);
      if (!partialsCheck) {
        this.partials[partialName] = partial;
      }
      return partialName;
    },
    makePartial(id, template) {
      const key = `partial-${id}`;
      const partialsCheck = Boolean(this.partials[id]);
      if (partialsCheck) {
        return key;
      }
      this.partials[key] = template;
      return key;
    },
  };

  const {componentMethods, utility: {findIndex, hasValue, get, isPlainObject, findItem, assignDeep, ensureArray, assign, each, isArray, isEmpty, sortNewest, sortOldest, clear, }} = app;
  const extendRactive = {
    async afterIndex(componentView, path, indexMatch, item, indexName) {
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await componentView.splice(path, index + 1, 0, ...ensureArray(item));
      } else {
        await componentView.push(path, item);
      }
    },
    async assign(componentView, path, mergeObject) {
      const item = componentView.get(path);
      if (hasValue(item)) {
        assignDeep(item, mergeObject);
        await componentView.update(path);
        return item;
      }
    },
    async beforeIndex(componentView, path, indexMatch, item, indexName) {
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await componentView.splice(path, index - 1, 0, ...ensureArray(item));
      } else {
        await componentView.push(path, item);
      }
    },
    async clearArray(componentView, path) {
      const arrayToClear = componentView.get(path);
      if (arrayToClear) {
        clear(arrayToClear);
        await componentView.update(path);
      }
    },
    findItem(componentView, path, indexMatch, indexName) {
      const item = find(componentView.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        return item;
      }
    },
    getIndex(componentView, path, indexMatch, indexName) {
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        return index;
      }
    },
    async mergeItem(componentView, path, indexMatch, newVal, indexName) {
      const item = findItem(componentView.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        assignDeep(item, newVal);
        await componentView.update(path);
        return item;
      }
    },
    async removeIndex(componentView, path, indexMatch, indexName) {
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await componentView.splice(path, index, 1);
      }
    },
    async setIndex(componentView, path, indexMatch, item, indexName, optionsArg) {
      const options = optionsArg || {};
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        const pathSuffix = (options.pathSuffix) ? `.${options.pathSuffix}` : '';
        await componentView.set(`${path}.${index}${pathSuffix}`, item);
      } else if (get('conflict', options) === 'insert') {
        await componentView[get('conflictMethod', options) || 'push'](path, item);
      }
    },
    async sortNewest(componentView, path, property) {
      const array = componentView.get(path);
      sortNewest(array, property, true);
      await componentView.update(path);
    },
    async sortOldest(componentView, path, property) {
      const array = componentView.get(path);
      sortOldest(array, property, true);
      await componentView.update(path);
    },
    async syncCollection(componentView, path, newValArg, type = 'push', indexName = 'id') {
      const oldVal = componentView.get(path);
      if (isPlainObject(oldVal)) {
        assignDeep(oldVal, newValArg);
      } else {
        const newVal = ensureArray(newValArg);
        each(newVal, (item) => {
          const oldValItem = findItem(oldVal, item[indexName], indexName);
          if (hasValue(oldValItem)) {
            assign(oldValItem, item);
          } else {
            oldVal[type](item);
          }
        });
      }
      await componentView.update(path);
    },
    async toggleIndex(componentView, path, indexMatchArg, pathSuffixArg, indexName) {
      let indexMatch;
      const arrayCheck = isArray(indexMatchArg);
      if (arrayCheck && !isEmpty(indexMatchArg)) {
        indexMatch = indexMatchArg.shift();
      } else {
        indexMatch = indexMatchArg;
      }
      const index = findIndex(componentView.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        const pathSuffix = (pathSuffixArg) ? `.${pathSuffixArg}` : '';
        await componentView.toggle(`${path}.${index}${pathSuffix}`);
      }
      if (arrayCheck && !isEmpty(indexMatchArg)) {
        await componentView.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
      }
    },
    async updateItem(componentView, path, indexMatch, react, indexName) {
      const item = findItem(componentView.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        react(item);
        await componentView.update(path);
        return item;
      }
    }
  };
  assign(componentMethods, {
    extendRactive(view) {
      each(extendRactive, (item, key) => {
        view[key] = function(...args) {
          return item(view, ...args);
        };
      });
    },
  });

  const getComponentName = (componentModel, componentName) => {
    return (componentModel === app.router.currentStateObject) ? 'navState' : componentName;
  };

  const {watch, demand: demand$1, utility: {each: each$3, isFunction, }} = app;
  const onHtml = async (matchFilename, componentName, json) => {
    const type = json.type;
    const filePath = json.name;
    if (!type.includes(matchFilename)) {
      return;
    }
    const html = await demand$1(filePath);
    if (isFunction(componentName)) {
      componentName(html);
    } else {
      each$3(app.findAllComponents(componentName), (item) => {
        item.resetTemplate(html);
      });
    }
  };
  const watchHtml = (matchFilename, componentName) => {
    return watch(matchFilename, (json) => {
      onHtml(matchFilename, componentName, json);
    });
  };
  watch.html = watchHtml;

  const {utility: {each: each$2, }} = app;
  const importPartials = (componentName, componentModel, asset) => {
    if (asset.partials) {
      each$2(asset.partials, (item, key) => {
        watchHtml(item, (html) => {
          const realName = getComponentName(componentModel, componentName);
          each$2(app.findAllComponents(realName), (subItem) => {
            subItem.resetPartial(key, html);
          });
        });
      });
    }
  };

  const importTemplate = (componentName, componentModel, asset) => {
    const template = asset.template;
    if (template) {
      watchHtml(template, (html) => {
        const realName = getComponentName(componentModel, componentName);
        if (realName) {
          app.findComponent(realName)
            .resetTemplate(html);
        }
      });
    }
  };

  const {utility: {each: each$5, }} = app;
  const multiEvent = (view, componentEvent, ...events) => {
    each$5(events, (item) => {
      if (item) {
        each$5(item.split(','), (subItem) => {
          view.fire(subItem.trim(), componentEvent);
        });
      }
    });
  };

  const {isEventNode, utility: {isEnter, }} = app;
  const preventDefault = function(callable) {
    return function(componentEvent, ...args) {
      if (componentEvent) {
        if (componentEvent.node && !isEventNode(componentEvent)) {
          componentEvent.notTarget = true;
        } else {
          componentEvent.isTarget = true;
        }
        const original = componentEvent.original;
        componentEvent.isEnter = (original && original.keyCode) ? isEnter(original) : true;
      }
      componentEvent.source = componentEvent.ractive;
      callable(componentEvent, ...args);
      return false;
    };
  };

  const {utility: {each: each$6, assign: assign$3, querySelector, }} = app;
  const headNode = querySelector('head');
  const importedCssCount = {};
  const importedCss = {};
  const render = (code, filePath) => {
    if (importedCss[filePath]) {
      importedCssCount[filePath]++;
    } else {
      importedCssCount[filePath] = 0;
      const node = document.createElement('style');
      node.innerHTML = code;
      node.setAttribute('data-src', filePath);
      headNode.appendChild(node);
      importedCss[filePath] = node;
    }
  };
  const unrender = (code, filePath) => {
    if (importedCss[filePath]) {
      importedCssCount[filePath]--;
      if (importedCssCount[filePath] < 0) {
        importedCss[filePath].remove();
        importedCss[filePath] = null;
        importedCssCount[filePath] = null;
      }
    }
  };
  const cssRender = (css) => {
    if (css) {
      each$6(css, render);
    }
  };
  const cssUnrender = (css) => {
    if (css) {
      each$6(css, unrender);
    }
  };
  const componentsWithCss = {};
  const registerCssComponent = (css, componentConfig) => {
    if (!css) {
      return;
    }
    each$6(css, (item, key) => {
      if (!componentsWithCss[key]) {
        componentsWithCss[key] = [];
      }
      componentsWithCss[key].push(componentConfig);
    });
  };
  assign$3(app, {
    componentsWithCss,
    importedCss,
    importedCssCount
  });

  const {componentMethods: componentMethods$1, watch: watch$1, utility: {map, each: each$4, get: get$1, ifInvoke}} = app;
  const createWatchers = (view, item, key) => {
    if (get$1('isWatcher', item._)) {
      view.watchers[key] = item;
      return;
    }
    item.options = item.options || {};
    item.methods = item.methods || {};
    let {prefix, suffix, } = item.options;
    const {methods, } = item;
    const createMethod = methods.create || 'push';
    const readMethod = methods.read || 'push';
    prefix = (prefix) ? `${prefix}.` : '';
    suffix = (suffix) ? `.${suffix}` : '';
    item.prefix = prefix;
    item.suffix = suffix;
    view.watchers[key] = watch$1({
      async create(json) {
        await view.syncCollection(key, json.item, createMethod);
        view.fire(`${prefix}create${suffix}`, json.item, json);
      },
      delete(json) {
        view.removeIndex(key, json.item.id);
        view.fire(`${prefix}delete${suffix}`, json.item, json);
      },
      async read(json) {
        await view.syncCollection(key, json.items, readMethod);
        view.fire(`${prefix}read${suffix}`, json.item, json);
      },
      async update(json) {
        await view.syncCollection(key, json.item, createMethod);
        view.fire(`${prefix}update${suffix}`, json.item, json);
      },
    }, item.options);
  };
  const removeInstance = function(view, css) {
    cssUnrender(css);
    each$4(view.watchers, (item, key) => {
      item.stop();
      item[key] = null;
    });
  };
  const onrenderInstance = function(view, css) {
    cssRender(css);
    if (view.watchers) {
      each$4(view.watchers, (item) => {
        item.start();
      });
    }
  };
  const constructEvent = function(componentConfig, componentEvent, sourceConstruct) {
    const {css, watchers, } = componentConfig;
    const view = componentEvent.ractive;
    const componentModel = componentConfig.model;
    const sourceOn = view.on.bind(view);
    if (sourceConstruct) {
      sourceConstruct(componentEvent, view);
    }
    if (componentModel) {
      app.navState = componentEvent.ractive;
    }
    view.onRaw = (componentEvt) => {
      componentEvt.source = componentEvt.ractive;
      return sourceOn(componentEvt);
    };
    view.on = (eventName, eventListener) => {
      if (eventListener) {
        return sourceOn(eventName, preventDefault(eventListener));
      } else {
        return sourceOn(map(eventName, preventDefault));
      }
    };
    each$4(componentMethods$1, (item) => {
      item(view, componentConfig);
    });
    view.watchers = (watchers) ? watchers(view) : {};
    if (view.watchers) {
      each$4(view.watchers, (item, key) => {
        createWatchers(view, item, key);
      });
    }
    view.on({
      multi(cmpntEvent, ...args) {
        return multiEvent(view, cmpntEvent, ...args);
      },
      render() {
        onrenderInstance(view, css);
      },
      teardown() {
        removeInstance(view, css);
      },
    });
  };
  const onConstruct = (componentConfig) => {
    const sourceConstruct = componentConfig.onconstruct;
    componentConfig.onconstruct = function(componentEvent) {
      componentEvent.source = componentEvent.ractive;
      constructEvent(componentConfig, componentEvent, sourceConstruct);
    };
    const sourceRender = componentConfig.onrender;
    componentConfig.onrender = function(componentEvent) {
      componentEvent.source = componentEvent.ractive;
      ifInvoke(sourceRender, componentEvent);
    };
  };

  const {utility: {cnsl, assign: assign$2, }} = app;
  cnsl('viewSetup Module', 'notify');
  const tooltip = window.RactiveTooltip;
  const initializeComponent = (componentConfig) => {
    componentConfig.decorators = assign$2(componentConfig.decorators || {}, {
      tooltip,
    });
    const {css, model: componentModel, asset, name: componentName, } = componentConfig;
    registerCssComponent(css, componentConfig);
    if (asset && (componentName || componentModel)) {
      importTemplate(componentName, componentModel, asset);
      importPartials(componentName, componentModel, asset);
    }
    onConstruct(componentConfig);
  };

  const ractive = window.Ractive;
  const buildComponent = (componentConfig) => {
    initializeComponent(componentConfig);
    const componentName = componentConfig.name;
    const componentModel = componentConfig.model;
    const Component = ractive.extend(componentConfig);
    if (componentName) {
      ractive.components[componentName] = Component;
    }
    if (componentModel) {
      componentModel.component = Component;
    }
    return Component;
  };

  const {demand, demandCss, demandHtml, utility: {assign: assign$1, each: each$1, ensureArray: ensureArray$1, isString: isString$1, }} = app;
  const asyncComponent = async function(componentConfig) {
    const componentModel = componentConfig.model;
    let asset = componentConfig.asset || {};
    if (isString$1(asset)) {
      asset = {
        css: [`${asset}style`],
        template: `${asset}template`,
      };
    }
    componentConfig.asset = asset;
    componentConfig.css = componentConfig.css || {};
    componentConfig.partials = componentConfig.partials || {};
    if (asset) {
      if (asset.template) {
        componentConfig.template = await demandHtml(asset.template);
      }
      if (asset.demand) {
        componentConfig.demand = await demand(asset.demand);
      }
      if (asset.partials) {
        assign$1(componentConfig.partials, await demandHtml(asset.partials));
      }
      if (asset.css) {
        const assetCss = asset.css;
        const loadCss = await demandCss(assetCss);
        each$1(ensureArray$1(loadCss), (item, index) => {
          let keyName = assetCss[index];
          if (!keyName.includes('.css')) {
            keyName = `${keyName}.css`;
          }
          componentConfig.css[keyName] = item;
        });
      }
    }
    const componentPromise = buildComponent(componentConfig);
    if (componentModel) {
      componentModel.component = componentPromise;
    }
    return componentPromise;
  };

  const {utility: {isString}} = app;
  const components = {};
  const generateComponent = (ComponentView, config) => {
    return new ComponentView(config);
  };
  const getComponentMethod = (componentName, config) => {
    const componentObject = components[componentName];
    return config ? generateComponent(componentObject, config) : componentObject;
  };
  const component = (componentName, componentConfigOption) => {
    let method;
    const componentConfig = (componentConfigOption) ? componentConfigOption : componentName;
    if (componentConfig) {
      if (isString(componentName)) {
        componentConfig.name = componentName;
      }
      if (componentConfig.asset) {
        method = asyncComponent;
      } else {
        method = buildComponent;
      }
    } else {
      return getComponentMethod(componentName);
    }
    console.log(componentConfig);
    return method(componentConfig);
  };
  app.component = component;

  const {demand: demand$2, watch: watch$2, utility: {each: each$7, querySelector: querySelector$1, isDom}} = app;
  const onCss = async (json) => {
    const filePath = json.name;
    const componentName = json.type;
    const componentsUsingCss = componentsWithCss[componentName];
    const node = importedCss[filePath] || importedCss[componentName] || querySelector$1(`[data-src="${filePath}"]`);
    if (node || componentsUsingCss) {
      const content = await demand$2(filePath);
      if (isDom(node)) {
        node.innerHTML = content;
      }
      if (componentsUsingCss) {
        each$7(componentsUsingCss, (item) => {
          item.asset.css[componentName] = content;
        });
      }
    }
  };
  watch$2(/\.css/, onCss);

  const {componentMethods: componentMethods$2, demand: demand$3, utility: {assign: assign$4, each: each$8, isFunction: isFunction$1}} = app;
  const RactiveComponent = window.Ractive;
  const view$1 = new RactiveComponent({
    data() {
      return {
        components: {
          dynamic: {},
          layout: {},
          main: {},
        },
        notification: [],
        pageTitle: '',
        screenSize: '',
      };
    },
    template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`,
  });
  view$1.on({
    async '*.loadComponent'(componentEvent) {
      const imported = await demand$3(componentEvent.get('demand'));
      const afterDemand = componentEvent.get('afterDemand');
      if (afterDemand) {
        const afterDemandEvents = afterDemand[componentEvent.original.type];
        each$8(afterDemandEvents, (item, key) => {
          if (isFunction$1(item)) {
            item(imported, item, key);
          } else {
            app.findComponent(key)
              .fire(item);
          }
        });
      }
    },
    '*.preventDefault'() {
      return false;
    },
  });
  componentMethods$2.extendRactive(view$1);
  app.importComponent = async (componentName, importURL, type = 'dynamic') => {
    if (importURL) {
      await demand$3(importURL);
    }
    await app.view.set(`components.${type}.${componentName}`, true);
    await view$1.update('components.${type}');
  };
  const pageTitleComponent = new RactiveComponent({
    append: true,
    data() {
      return {
        text() {
          return view$1.get('pageTitle');
        }
      };
    },
    template: `<title>{{text()}}</title>`,
  });
  assign$4(app, {
    async render() {
      await view$1.render('body');
      await pageTitleComponent.render('head');
    },
    view: view$1,
  });

  const {utility: {drop}} = app;
  let notificationStatus;
  const notifications = [];
  const spawnNotification = (data) => {
    if (notificationStatus) {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon
      }, data.options);
      const number = notifications.push(notification) - 1;
      setTimeout(() => {
        notification.close();
        drop(notifications, number, 1);
      }, data.time || 4000);
      return notification;
    }
  };
  app.notify = async (data) => {
    if (Notification.permission === 'granted') {
      return spawnNotification(data);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        spawnNotification({
          body: 'enabled',
          title: 'Notifications',
        });
      }
    }
  };

  const {demandJs, demandLang, componentMethods: componentMethods$3, utility: {cnsl: cnsl$1, assign: assign$5, each: each$9, map: map$1, isString: isString$2, rest, camelCase, omit, last, batch, eventAdd: eventAdd$1, has, whileArray, }, } = app;
  const ractive$1 = window.Ractive;
  const router = {};
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  cnsl$1('ROUTER ONLINE', 'important');
  assign$5(router, {
    add(item) {
      each$9(item, router.addObject);
    },
    addObject(item, key) {
      const reg = new RegExp(key);
      router.routes.push(() => {
        return router.routeChecker(item, reg);
      });
    },
    attachEvents() {
      eventAdd$1(window, 'popstate', (eventArg) => {
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
      cnsl$1('Router Loading State', 'notify');
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
          ractive$1.components.navState = router.currentStateObject.component;
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
      assign$5(router.location.previous, omit(router.location, ['previous']));
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
      map$1(top.location, (item, index) => {
        if (isString$2(item)) {
          router.location[index] = item;
        }
      });
      router.location.pathScored = router.location.pathname.replace(/\//g, '_');
      router.location.paths = rest(router.location.pathname.split('/'));
      router.location.pathCamel = camelCase(router.location.paths.join('_'));
    }
  });
  componentMethods$3.routerLoad = (componentView) => {
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
  assign$5(app, {
    router,
  });

}());

}());
