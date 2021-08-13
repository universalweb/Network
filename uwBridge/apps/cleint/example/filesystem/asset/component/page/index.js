(async () => {
  import { utilMarkdown } from 'js/util/markdown';
  import 'js/lib/showdown.js';
  const {
    component,
    translate,
    view,
    utility: {
      assignDeep,
      cnsl
    }
  } = app;
  cnsl('page Module', 'notify');
  $.page = exports;
  exports.page = function(pageModule) {
    let templateUrl;
    const language = pageModule.assets.language;
    const config = assignDeep({
      data: {},
      partials: {},
    }, pageModule.config || {});
    const partials = config.partials;
    const data = config.data;
    config.data.language = language;
    if (language.content) {
      partials.contentPartial = utilMarkdown.html(language.content);
    } else {
      partials.contentPartial = language.content = '';
    }
    if (data.customContent) {
      partials.contentPartial = language.content + data.customContent;
    }
    if (language.custom) {
      templateUrl = 'component/page/custom';
    } else {
      templateUrl = 'component/page/template';
    }
    config.data.translate = translate;
    const OGConfig = config.data;
    config.data = function() {
      return OGConfig;
    };
    const cmpntConfig = assignDeep({
      model: pageModule,
      asset: assignDeep({
        template: templateUrl,
        css: [`${exports.dirname}style`]
      }, pageModule.asset || {}),
    }, config);
    console.log(pageModule, cmpntConfig);
    return component(cmpntConfig);
  };
  exports.open = function(pageModule) {
    view.set('pageTitle', pageModule.assets.language.pageTitle || pageModule.config.data.pageTitle);
  };
  exports.close = function() {};
  exports.compile = function(pageModule) {
    pageModule.open = function(options) {
      exports.open(pageModule, options);
    };
    pageModule.close = function(options) {
      exports.close(pageModule, options);
    };
    return exports.page(pageModule);
  };
  app.page = exports;
})();
