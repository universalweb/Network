import app from '../app';
import multiEvent from './multiEvent';
import preventDefault from './preventDefault';
import { cssRender, cssUnrender } from './css';
const {
  componentMethods,
  watch,
  utility: {
    map,
    each,
    get,
    ifInvoke
  }
} = app;
const createWatchers = (view, item, key) => {
  if (get('isWatcher', item._)) {
    view.watchers[key] = item;
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
  view.watchers[key] = watch({
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
  each(view.watchers, (item, key) => {
    item.stop();
    item[key] = null;
  });
};
const onrenderInstance = function(view, css) {
  cssRender(css);
  if (view.watchers) {
    each(view.watchers, (item) => {
      item.start();
    });
  }
};
export const constructEvent = function(componentConfig, componentEvent, sourceConstruct) {
  const {
    css,
    watchers,
  } = componentConfig;
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
  each(componentMethods, (item) => {
    item(view, componentConfig);
  });
  view.watchers = (watchers) ? watchers(view) : {};
  if (view.watchers) {
    each(view.watchers, (item, key) => {
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
export default onConstruct;
