(async function () {
  const {
    defineProperty,
    assign,
    createTag
  } = app;
  defineProperty($, 'contentWindow', {
    get() {
      const object = app.find('.networkFrame');
      return object ? object.contentWindow : false;
    }
  });
  $.cleanMethods = function (contentWindowArg) {
    const contentWindow = contentWindowArg || $.contentWindow;
    contentWindow.gc();
    const fakeConsole = $.contentWindow.console;
    fakeConsole.error = () => {};
    fakeConsole.log = () => {};
    fakeConsole.warn = () => {};
    fakeConsole.trace = () => {};
  };
  $.jquery = function (item) {
    const object = $.contentWindow;
    return (object && object.jQuery) ? object.jQuery(item) : false;
  };
  $.qsa = function (item) {
    const object = $.contentWindow;
    return (object) ? object.document.querySelectorAll(item) : false;
  };
  $.qs = function (item) {
    const object = $.contentWindow;
    return (object) ? object.document.querySelector(item) : false;
  };
  $.gcFrame = function () {
    $.contentWindow.gc();
  };
  $.frameCw = function (name) {
    const object = app.find(name);
    return object ? object.contentWindow : false;
  };
  $.frameJquery = function (name, item) {
    const object = app.find(name);
    return object ? object.contentWindow.jQuery(item) || object.contentWindow.document.querySelectorAll(item) : false;
  };
  $.setHtml = function (html) {
    const div = createTag('div');
    div.innerHTML = html;
    return div;
  };
  $.fetchIt = function (url, options) {
    return $.contentWindow.fetch(url, assign({
      credentials: 'same-origin'
    }, options));
  };
  //Fake events for gmail
  function mousedown(cb) {
    const event = new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      //console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      //console.log("not canceled");
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
      //console.log("canceled");
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
      //console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      //console.log("not canceled");
    }
  }
  $.mouseClick = mouseclick;

  function mouseup(cb) {
    const event = new MouseEvent('mouseup', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const canceled = !cb.dispatchEvent(event);
    if (canceled) {
      // A handler called preventDefault.
      //console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      //console.log("not canceled");
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
      //console.log("canceled");
    } else {
      // None of the handlers called preventDefault.
      //console.log("not canceled");
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
      $.jquery(node)
        .sendkeys(keys);
      focus(node);
    }
  };
  window.simulate = simulate;
  const history = $.history = {
    setup() {
      const frame = app.find('.networkFrame');
      history.index = 0;
      history.max = 0;
      frame.addEventListener('load', history.store);
    },
    save() {
      history.index++;
      history.max = history.index;
    },
    store() {
      const ogPushState = $.contentWindow.history.pushState.bind($.contentWindow.history);
      $.contentWindow.history.pushState = function (a, b, c) {
        ogPushState(a, b, c);
        history.save();
      };
      history.save();
    },
    back() {
      if (history.index > 1 && history.index <= history.max) {
        history.index--;
        $.contentWindow.history.back();
      }
    },
    forward() {
      if (history.index >= 0 && history.index < history.max) {
        history.index++;
        $.contentWindow.history.forward();
      }
    }
  };
  app.on('*.browserForward', history.forward);
  app.on('*.browserBack', history.back);
})();
