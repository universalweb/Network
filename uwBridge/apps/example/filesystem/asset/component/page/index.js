(async function () {
  import {
    showdown,
    utilMarkdown
  } from 'js/lib/showdown.js,js/util/markdown.js';
  const {
    translate,
    model,
    assignDeep,
    cnsl
  } = app;
  cnsl('page Module', 'notify');
  console.trace();
  $.page = exports;
  exports.page = function (pageModule) {
    let templateUrl;
    const language = pageModule.assets.language,
      config = assignDeep({
        data: {},
        partials: {},
      }, pageModule.config || {}),
      partials = config.partials,
      data = config.data;
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
    config.data = function () {
      return OGConfig;
    };
    return component(assignDeep({
      model: pageModule,
      asset: assignDeep({
        template: templateUrl,
        css: [`${exports._.dirname}style`]
      }, pageModule.asset || {}),
    }, config));
  };
  exports.open = function (pageModule) {
    app.set('pageTitle', pageModule.assets.language.pageTitle || pageModule.config.data.pageTitle);
  };
  exports.close = function () {};
  exports.compile = function (pageModule) {
    pageModule.open = function (options) {
      exports.open(pageModule, options);
    };
    pageModule.close = function (options) {
      exports.close(pageModule, options);
    };
    return exports.page(pageModule);
  };
  model.page = exports;
})();
