(async function() {

  const {
    isPlainObject,
    isArray,
    isString,
    isFunction,
    cnsl,
    hasValue,
    remove,
    map,
    each,
    mapArray,
    mapObject,
    has,
    pushApply,
    createFragment,
    createTag,
    replace,
    mapWhileFalse,
    eachWhileFalse,
    querySelector,
    toArray,
    rest,
    last,
    loadedAssets,
    isDom,
    pipe,
    drop,
    promise,
    assign,
    defineProperty,
    demandHtml,
    demandCss,
    demandJs,
    demandLang,
    raf,
    timer,
    updateDimensions,
    appState,
    debounce,
    eventAdd,
    inAsync,
    omit,
    camel,
    clear,
    socket,
    batch,
    language,
    findIndex,
    findItem,
    get,
    keys,
    isEventNode,
    isEnter,
    ensureArray,
    assignDeep,
    filter,
    isEmpty,
    sortNewest,
    sortOldest
  } = app;

  var security = $.security = {};
  security.clear = function() {
    //Cleanup
    $.selector('#acidjs').remove();
  };
  security.clear();

  Ractive.prototype.data = {
    $,
    getComponent(nameArg) {
      const name = nameArg;
      const partial = `<${name} />`;
      console.log(nameArg);
      const partialsCheck = !!this.partials[name];
      if (!partialsCheck) {
        this.partials[name] = partial;
      }
      return name;
    },
    makePartial(id, template) {
      const key = `partial-${id}`;
      const partialsCheck = !!this.partials[id];
      if (partialsCheck) {
        return key;
      }
      this.partials[key] = template;
      return key;
    },
  };

  const extendRactive = {
    async setIndex(self, path, indexMatch, item, indexName, optionsArg) {
      const options = optionsArg || {};
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        const pathSuffix = (options.pathSuffix) ? `.${options.pathSuffix}` : '';
        await self.set(`${path}.${index}${pathSuffix}`, item);
      } else if (get('conflict', options) === 'insert') {
        await self[get('conflictMethod', options) || 'push'](path, item);
      }
    },
    async removeIndex(self, path, indexMatch, indexName) {
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await self.splice(path, index, 1);
      }
    },
    findItem(self, path, indexMatch, indexName) {
      const item = findItem(self.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        return item;
      }
    },
    getIndex(self, path, indexMatch, indexName) {
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        return index;
      }
    },
    async syncCollection(self, path, newValArg, type = 'push', indexName = 'id') {
      const oldVal = self.get(path);
      if (isPlainObject(oldVal)) {
        assignDeep(oldVal, newValArg);
      } else {
        const newVal = ensureArray(newValArg);
        each(newVal, (item) => {
          const oldValItem = findItem(oldVal, item[indexName], indexName);
          if (!hasValue(oldValItem)) {
            oldVal[type](item);
          } else {
            assign(oldValItem, item);
          }
        });
      }
      await self.update(path);
    },
    async updateItem(self, path, indexMatch, react, indexName) {
      const item = findItem(self.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        react(item);
        await self.update(path);
        return item;
      }
    },
    async mergeItem(self, path, indexMatch, newVal, indexName) {
      const item = findItem(self.get(path), indexMatch, indexName);
      if (hasValue(item)) {
        assignDeep(item, newVal);
        await self.update(path);
        return item;
      }
    },
    async assign(self, path, mergeObject) {
      const item = self.get(path);
      if (hasValue(item)) {
        assignDeep(item, mergeObject);
        await self.update(path);
        return item;
      }
    },
    async afterIndex(self, path, indexMatch, item, indexName) {
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await self.splice(path, index + 1, 0, ...ensureArray(item));
      } else {
        await self.push(path, item);
      }
    },
    async beforeIndex(self, path, indexMatch, item, indexName) {
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        await self.splice(path, index - 1, 0, ...ensureArray(item));
      } else {
        await self.push(path, item);
      }
    },
    async clearArray(self, path) {
      const arrayToClear = self.get(path);
      if (arrayToClear) {
        clear(arrayToClear);
        await self.update(path);
      }
    },
    async toggleIndex(self, path, indexMatchArg, pathSuffixArg, indexName) {
      let indexMatch;
      const arrayCheck = isArray(indexMatchArg);
      if (arrayCheck && !isEmpty(indexMatchArg)) {
        indexMatch = indexMatchArg.shift();
      } else {
        indexMatch = indexMatchArg;
      }
      const index = findIndex(self.get(path), indexMatch, indexName);
      if (hasValue(index)) {
        const pathSuffix = (pathSuffixArg) ? `.${pathSuffixArg}` : '';
        await self.toggle(`${path}.${index}${pathSuffix}`);
      }
      if (arrayCheck && !isEmpty(indexMatchArg)) {
        await self.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
      }
    },
    async sortNewest(self, path, property) {
      const array = self.get(path);
      sortNewest(array, property, true);
      await self.update(path);
    },
    async sortOldest(self, path, property) {
      const array = self.get(path);
      sortOldest(array, property, true);
      await self.update(path);
    },
  };

  cnsl('viewSetup Module', 'notify');
  const headNode = querySelector('head'),
    components = {},
    globalEvents = $.globalEvents = {
      editIndex(self) {
        each(extendRactive, (item, key) => {
          self[key] = function(...args) {
            return item(self, ...args);
          };
        });
      },
    },
    generateComponent = (cmpnt, config) => new cmpnt(config),
    getComponentMethod = (name, config) => {
      const componentObject = components[name];
      return config ? generateComponent(componentObject, config) : componentObject;
    },
    loadedStyleCount = {},
    loadedStyles = {},
    addCSSToPage = (object, name) => {
      if (!loadedStyles[name]) {
        loadedStyleCount[name] = 0;
        const node = loadedStyles[name] = createTag('style');
        node.innerHTML = object;
        node.setAttribute('data-src', name);
        headNode.appendChild(node);
      } else {
        loadedStyleCount[name]++;
      }
    },
    removeCSS = (object, name) => {
      if (loadedStyles[name]) {
        loadedStyleCount[name]--;
        if (loadedStyleCount[name] < 0) {
          loadedStyles[name].remove();
          loadedStyles[name] = null;
          loadedStyleCount[name] = null;
        }
      }
    },
    removeInstance = function(self, css) {
      if (css) {
        each(css, removeCSS);
      }
      each(self.pipes, (item, key) => {
        item.stop();
        item[key] = null;
        if (item.watch) {
          push(`${item.prefix}unwatch${item.suffix}`);
        }
      });
    },
    onrenderInstance = function(view, css) {
      if (css) {
        each(css, addCSSToPage);
      }
      if (view.pipes) {
        each(view.pipes, (item) => {
          item.start();
        });
      }
    },
    configWithCss = $.configWithCss = {},
    multiEvent = function(self, event) {
      each(drop(toArray(arguments), 2), (item) => {
        if (item) {
          each(item.split(','), (subItem) => {
            self.fire(subItem.trim(), event);
          });
        }
      });
    },
    isNavState = (componentModel, componentName) => (componentModel === $.router.currentStateObject) ? 'navState' : componentName,
    preventDefault = function(funt) {
      return function(...args) {
        const event = args[0];
        if (event) {
          if (event.node && !isEventNode(event)) {
            event.notTarget = true;
          } else {
            event.isTarget = true;
          }
          const original = event.original;
          event.isEnter = (original && original.keyCode) ? isEnter(original) : true;
        }
        funt.call(this, ...args);
        return false;
      };
    },
    setMainMethods = (componentConfig) => {
      componentConfig.decorators = assign(componentConfig.decorators || {}, {
        tooltip: RactiveTooltip,
      });
      const ogConstruct = componentConfig.onconstruct;
      const ogRender = componentConfig.onrender;
      const {
        css,
        model: componentModel,
        asset,
        name,
        pipes,
      } = componentConfig;
      if (css) {
        each(css, (item, key) => {
          if (!configWithCss[key]) {
            configWithCss[key] = [];
          }
          configWithCss[key].push(componentConfig);
        });
      }
      if (asset && (name || componentModel)) {
        if (asset.template) {
          const pipeString = asset.template.replace(/\//g, '.');
          pipe.onHtml(`${pipeString}.html`, (html) => {
            console.log(name);
            const compntName = isNavState(componentModel, name);
            if (compntName) {
              app.findComponent(compntName)
                .resetTemplate(html);
            }
          });
        }
        if (asset.partials) {
          let partialPipeString;
          each(asset.partials, (item, key) => {
            partialPipeString = asset.template.replace(/\//g, '.');
            pipe.onHtml(`${partialPipeString}.html`, (html) => {
              const compntName = isNavState(componentModel, name);
              each(app.findAllComponents(compntName), (subItem) => {
                subItem.resetPartial(key, html);
              });
            });
          });
        }
      }
      componentConfig.onconstruct = function() {
        const self = this;
        if (ogConstruct) {
          ogConstruct.call(self);
        }
        const ogOn = self.on;
        self.on = function(nameArg, dataArg) {
          if (dataArg) {
            return ogOn.call(self, nameArg, preventDefault(dataArg));
          } else {
            return ogOn.call(self, map(nameArg, preventDefault));
          }
        };
        self.onRaw = ogOn;
        self.pipes = (pipes) ? pipes(self) : {};
        each(globalEvents, (item) => {
          item(self, componentConfig);
        });
        if (self.pipes) {
          each(self.pipes, (item, key) => {
            if (get('_.isPipe', item)) {
              self.pipes[key] = item;
              return;
            }
            item.options = item.options || {};
            item.methods = item.methods || {};
            let {
              prefix,
              suffix,
            } = item.options;
            const {
              methods,
            } = item;
            const createMethod = methods.create || 'push';
            const readMethod = methods.read || 'push';
            prefix = (prefix) ? `${prefix}.` : '';
            suffix = (suffix) ? `.${suffix}` : '';
            item.prefix = prefix;
            item.suffix = suffix;
            self.pipes[key] = pipe.on({
              async create(json) {
                await self.syncCollection(key, json.item, createMethod);
                self.fire(`${prefix}create${suffix}`, json.item, json);
              },
              async read(json) {
                await self.syncCollection(key, json.items, readMethod);
                self.fire(`${prefix}read${suffix}`, json.item, json);
              },
              async update(json) {
                console.log(`${prefix}update${suffix}`);
                await self.syncCollection(key, json.item, createMethod);
                self.fire(`${prefix}update${suffix}`, json.item, json);
              },
              delete(json) {
                console.log(json);
                self.removeIndex(key, json.item.id);
                self.fire(`${prefix}delete${suffix}`, json.item, json);
              },
            }, item.options);
            if (item.watch) {
              push(`${prefix}watch${suffix}`);
            }
          });
        }
        self.on({
          multi(...args) {
            return multiEvent(self, ...args);
          },
          render() {
            onrenderInstance(self, css);
          },
          teardown() {
            removeInstance(self, css);
          },
        });
      };
    },
    buildComponent = (componentConfig) => {
      const componentModel = componentConfig.model;
      setMainMethods(componentConfig);
      const ogConstruct = componentConfig.onconstruct;
      if (componentModel) {
        componentConfig.onconstruct = function() {
          $.navState = this;
          if (ogConstruct) {
            ogConstruct.call(this);
          }
        };
      }
      const Component = Ractive.extend(componentConfig);
      if (componentConfig.name) {
        Ractive.components[componentConfig.name] = Component;
      }
      if (componentModel) {
        componentModel.component = Component;
      }
      return Component;
    },
    asyncCompileComponent = async function(componentConfig) {
      const componentModel = componentConfig.model;
      const asset = componentConfig.asset;
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
          assign(componentConfig.partials, await demandHtml(asset.partials));
        }
        if (asset.css) {
          const assetCss = asset.css;
          const loadCss = await demandCss(assetCss);
          each(ensureArray(loadCss), (item, index) => {
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
  $.loadedStyleCount = loadedStyleCount;

  const componentMethod = (objectOrStringArg, optionalConfigArg) => {
    let componentConfig = optionalConfigArg;
    if (!componentConfig) {
      componentConfig = objectOrStringArg;
    } else {
      componentConfig.name = objectOrStringArg;
    }
    let method;
    if (isArray(componentConfig)) {
      return each(componentConfig, componentMethod);
    } else if (isString(componentConfig)) {
      method = getComponentMethod;
    } else if (componentConfig.asset) {
      method = asyncCompileComponent;
    } else {
      method = buildComponent;
    }
    return method(componentConfig);
  };

  $.component = componentMethod;

  var app = $.app = new Ractive({
    template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`,
    data() {
      return {
        notification: [],
        components: {
          main: {},
          layout: {},
          dynamic: {},
        }
      }
    }
  });
  app.on({
    async '*.loadComponent' (event) {
      const imported = await demand(event.get('demand'));
      const afterDemand = event.get('afterDemand');
      if (afterDemand) {
        const afterDemandEvents = afterDemand[event.original.type];
        each(afterDemandEvents, (item, key) => {
          if (isFunction(item)) {
            item(imported, item, key);
          } else {
            app.findComponent(key)
              .fire(item);
          }
        });
      }
    },
  });
  globalEvents.editIndex(app);
  app.dynamicComponent = async function(name, state = true) {
    await app.set(`components.dynamic.${name}`, state);
    await app.update('components.dynamic');
  };
  await app.render('body');
  var pageTitleComponent = new Ractive({
    template: `<title>{{text()}}</title>`,
    append: true,
    data() {
      return {
        text() {
          return app.get('pageTitle');
        }
      };
    }
  });
  await pageTitleComponent.render('head');

  var notificationStatus,
    notifications = $.notifications = [],
    spawnNotification = (data) => {
      if (notificationStatus) {
        var noti = new Notification(data.title, {
          body: data.body,
          icon: data.icon
        }, data.options);
        var number = notifications.push(noti) - 1;
        setTimeout(() => {
          noti.close();
          drop(notifications, number, 1);
        }, data.time || 4000);
        return noti;
      }
    };

  $.notify = function notifyMe(data) {
    if (Notification.permission === "granted") {
      var notification = spawnNotification(data);
    } else if (Notification.permission !== 'denied') {
      (async function() {
        var permission = await Notification.requestPermission();
        if (permission === "granted") {
          notifyMe({
            title: 'Notifications',
            body: 'enabled'
          });
        }
      })();
    }
  };

  notificationStatus = await Notification.requestPermission();

  const cleanCssFilePath = /\.css|css\//g,
    pipeOnCss = async function(json) {
      const filename = json.name,
        componentName = json.type,
        componentsUsingCss = configWithCss[componentName],
        node = loadedStyles[filename] || loadedStyles[componentName] || querySelector(`[data-src="${filename}"]`);
      if (node || componentsUsingCss) {
        console.log(node, componentsUsingCss);
        const content = await demand(filename);
        if (isDom(node)) {
          node.innerHTML = content;
        }
        if (componentsUsingCss) {
          each(componentsUsingCss, (object) => {
            object.asset.css[componentName] = content;
          });
        }
      }
    },
    pipeOnHtml = async function(matchFilename, componentName, json) {
      const type = json.type;
      const name = json.name;
      if (!type.includes(matchFilename)) {
        return;
      }
      const html = await demand(name);
      if (isFunction(componentName)) {
        componentName(html);
      } else {
        console.log(app.findAllComponents(componentName));
        each(app.findAllComponents(componentName), (item) => {
          item.resetTemplate(html);
        });
      }
    };
  pipe.on(/\.css/, pipeOnCss);
  pipe.onHtml = function(matchFilename, componentName) {
    return pipe.on(matchFilename, (json) => {
      pipeOnHtml(matchFilename, componentName, json);
    });
  };

  /*
    Automatic language detection and model loading.
    Language models are injected into the open functions of routed models via the options object
    Language will default to english if there is no detected one or it's not supported in the list

    Automatic Model loading of associated pages

    Pages have a open, close, reload method for initial unpacking and cleanup
    This allows one to have managed GC and DOM cleanup when a new section of the app is loaded

    All pages are models so they are cached and never re-requested during the page time.

    New models are fetched by default for map page load unless saved to cache.
    Entire requests are saved as well as files.
  */
  const router = {},
    hostname = window.location.hostname,
    origin = window.location.origin;
  cnsl('ROUTER ONLINE', 'important');
  assign(router, {
    routes: [],
    location: {
      previous: {},
    },
    updateLocation(data) {
      map(top.location, function(item, index) {
        if (isString(item)) {
          router.location[index] = item;
        }
      });
      router.location.pathScored = router.location.pathname.replace(/\//g, '_');
      router.location.paths = rest(router.location.pathname.split('/'));
      router.location.pathCamel = camel(router.location.paths.join('_'));
    },
    saveState() {
      assign(router.location.previous, omit(router.location, ['previous']));
    },
    objectRoutes: {},
    add(item, data) {
      var reg = new RegExp(item);
      router.routes.push(function() {
        var matching = router.location.pathname.match(reg);
        if (matching) {
          router.match = matching;
          var route = data.route(),
            routePath = (last(route.path) == '/') ? route.path : route.path + '/',
            routePath = route.path = (routePath[0] != '/') ? '/' + routePath : routePath,
            routeRequire = data.require;
          if (router.objectRoutes[routePath]) {
            router.go(router.objectRoutes[routePath]);
          } else {
            (async function() {
              if (!data.loaded && routeRequire) {
                await demandJs(routeRequire);
              }
              var object = await demandJs('routes' + routePath);
              var lang = await demandLang(routePath);
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
      });
    },
    closeState(previousStateObject) {
      if (previousStateObject) {
        if (!previousStateObject.closed) {
          router.forceClose(previousStateObject);
        }
      }
    },
    forceClose(currentStateObject) {
      app.set('navState', false);
      var nullCurrentState = (!currentStateObject) ? true : false;
      currentStateObject = currentStateObject || router.currentStateObject;
      if (currentStateObject) {
        if (router.currentStateObject.pipes) {
          router.currentStateObject.pipes.stop();
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
    reloadState(currentStateObject) {
      var currentStateObject = currentStateObject || router.currentStateObject;
      if (currentStateObject) {
        if (currentStateObject.reload) {
          batch(currentStateObject.reload);
        }
      }
    },
    openState(openModel) {
      // close event
      var previousStateObject = router.currentStateObject;
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
        (async function() {
          await app.set('navState', false);
          Ractive.components.navState = router.currentStateObject.component;
          await app.set('navState', true);
          if (router.currentStateObject.pipes) {
            router.currentStateObject.pipes.start();
          }
        })();
      }
    },
    go(route) {
      router.openState(route);
      if (router.analytics) {
        router.analytics();
      }
    },
    loadState() {
      cnsl('Router Loading State', 'notify');
      eachWhileFalse(router.routes, item => item());
    },
    attachEvents() {
      eventAdd(window, 'popstate', (event) => {
        router.saveState();
        router.updateLocation();
        router.loadState();
        event.preventDefault();
      }, true);
    },
    setState(url, title, object) {
      // pushState
      if (hostname + url === hostname + window.location.pathname) {
        router.reloadState();
      } else {
        history.pushState(object, title, url);
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
  });
  globalEvents.routerLoad = function(view) {
    view.on({
      routerLoad(event) {
        const href = event.node.href,
          node = event.node;
        if (!href) {
          router.pushState(event.get('href') || node.getAttribute('data-href'));
        } else if (has(href, origin) || has(href, hostname)) {
          event.preventDefault();
          router.pushState(node.getAttribute('href'));
        }
        return false;
      },
      routerBack() {
        if (!router.location.previous.hostname) {
          router.pushState('/');
        } else {
          window.history.back();
        }
      },
      routerForward() {
        if (!router.location.previous.hostname) {
          router.pushState('/');
        } else {
          window.history.forward();
        }
      },
    });
  };
  router.updateLocation();
  router.attachEvents();
  $.router = router;

  var {
    isAgent
  } = app;
  var updateResize = debounce(function() {
    app.set('bodyHeight', appState.bodyHeight);
    app.set('bodyWidth', appState.bodyWidth);
    app.set('windowHeight', appState.windowHeight);
    app.set('windowWidth', appState.windowWidth);

    var width = appState.windowWidth,
      sizeStyle;
    if (isAgent.mobile) {
      sizeStyle = 'mobileScreen';
    } else if (width < 1024) {
      sizeStyle = 'smallScreen';
    } else if (width < 1920) {
      sizeStyle = 'mediumScreen';
    } else if (width < 3000) {
      sizeStyle = 'hdScreen';
    } else if (width > 3000) {
      sizeStyle = '4kScreen';
    }
    console.log(sizeStyle);
    app.set('sizeStyle', sizeStyle);
  }, 250);

  eventAdd(window, 'resize', function() {
    raf(updateResize);
  }, true);

  updateResize();

  // Function to animate the scroll
  $('smoothScroll', function smoothScroll(element, to, duration) {
    if (duration <= 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;

    raf(function() {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop === to) return;
      smoothScroll(element, to, duration - 10);
    });
  });

})();