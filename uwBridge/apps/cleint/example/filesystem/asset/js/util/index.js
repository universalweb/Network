(async function() {
  const {
    view,
    utility: {
      defineProperty,
      assign,
    }
  } = app;
  defineProperty(app, 'contentWindow', {
    get() {
      const object = app.find('.networkFrame');
      return object ? object.contentWindow : false;
    }
  });
  app.cleanMethods = function(contentWindowArg) {
    const contentWindow = contentWindowArg || app.contentWindow;
    contentWindow.gc();
    const fakeConsole = app.contentWindow.console;
    fakeConsole.error = () => {};
    fakeConsole.log = () => {};
    fakeConsole.warn = () => {};
    fakeConsole.trace = () => {};
  };
  app.jquery = function(item) {
    const object = app.contentWindow;
    return (object && object.jQuery) ? object.jQuery(item) : false;
  };
  app.qsa = function(item) {
    const object = app.contentWindow;
    return (object) ? object.document.querySelectorAll(item) : false;
  };
  app.qs = function(item) {
    const object = app.contentWindow;
    return (object) ? object.document.querySelector(item) : false;
  };
  app.gcFrame = function() {
    app.contentWindow.gc();
  };
  app.frameCw = function(name) {
    const object = app.find(name);
    return object ? object.contentWindow : false;
  };
  app.frameJquery = function(name, item) {
    const object = app.find(name);
    return object ? object.contentWindow.jQuery(item) || object.contentWindow.document.querySelectorAll(item) : false;
  };
  app.fetchIt = function(url, options) {
    return app.contentWindow.fetch(url, assign({
      credentials: 'same-origin'
    }, options));
  };
  // Fake events for gmail
  function mousedown(cb) {
    const event = new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      // console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      // console.log("not canceled");
    }
  }
  function mouseover(cb) {
    const event = new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      // console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      //    console.log("not canceled");
    }
  }
  function mouseclick(cb) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      // console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      // console.log("not canceled");
    }
  }
  app.mouseClick = mouseclick;
  function mouseup(cb) {
    const event = new MouseEvent('mouseup', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      // console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      // console.log("not canceled");
    }
  }
  function focus(cb) {
    const event = new MouseEvent('focus', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      // console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      // console.log("not canceled");
    }
  }
  function fullClick(node) {
    focus(node);
    mouseover(node);
    mousedown(node);
    mouseup(node);
  }
  const simulate = {
    click(node) {
      mouseover(node);
      mousedown(node);
      fullClick(node);
      focus(node);
    },
    hover(node) {
      mouseover(node);
      mousedown(node);
      focus(node);
    },
    clickSendKeys(nodeArg, keys) {
      const node = nodeArg || this;
      fullClick(node);
      app.jquery(node)
        .sendkeys(keys);
      focus(node);
    }
  };
  window.simulate = simulate;
  const appHistory = {
    setup() {
      const frame = app.find('.networkFrame');
      appHistory.index = 0;
      appHistory.max = 0;
      frame.addEventListener('load', appHistory.store);
    },
    save() {
      appHistory.index++;
      appHistory.max = appHistory.index;
    },
    store() {
      const ogPushState = app.contentWindow.appHistory.pushState.bind(app.contentWindow.appHistory);
      app.contentWindow.appHistory.pushState = function(a, b, c) {
        ogPushState(a, b, c);
        appHistory.save();
      };
      appHistory.save();
    },
    back() {
      if (appHistory.index > 1 && appHistory.index <= appHistory.max) {
        appHistory.index--;
        app.contentWindow.appHistory.back();
      }
    },
    forward() {
      if (appHistory.index >= 0 && appHistory.index < appHistory.max) {
        appHistory.index++;
        app.contentWindow.appHistory.forward();
      }
    }
  };
  app.appHistory = appHistory;
  view.on('*.browserForward', appHistory.forward);
  view.on('*.browserBack', appHistory.back);
})();
