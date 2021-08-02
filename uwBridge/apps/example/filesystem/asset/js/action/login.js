(async function () {
  const scope = exports;
  $.login = scope;
  const {
    router,
    jsonParse,
    stringify,
    ifInvoke,
    promise,
    api
  } = app;
  cnsl('login model', 'notify');
  let creditCheck = localStorage.credit;
  scope.success = function (json, accept) {
    cnsl('login success', 'notify');
    console.log(json);
    if (json.credit) {
      const credit = json.credit;
      $.credit = credit;
      localStorage.credit = stringify(credit);
      api.request('credit', credit);
    } else if (localStorage.credit) {
      $.credit = jsonParse(localStorage.credit);
    }
    app.set('loginStatus', true);
    creditCheck = $.credit;
    ifInvoke(accept, json);
  };
  scope.fail = function (data, reject) {
    cnsl('login failure', 'notify');
    localStorage.removeItem('credit');
    $.credit = null;
    app.set('profile', false);
    app.set('loginStatus', false);
    if (creditCheck) {
      creditCheck = false;
      localStorage.clear();
      router.pushState('/page/login');
    } else if (data && data.message) {
      console.log(data);
      $.alert(data);
    }
    ifInvoke(reject, data);
  };
  scope.logout = async function () {
    await request('user.logout', {});
    scope.fail();
  };
  scope.go = function (data) {
    const credit = (localStorage.credit) ? {
      credit: jsonParse(localStorage.credit)
    } : false;
    if (!credit && !data) {
      return;
    } else if (credit) {
      api.request('credit', credit);
    }
    return promise(async (accept, reject) => {
      const json = await request('user.verify', credit || data);
      console.log(json);
      if (json.loginStatus) {
        scope.success(json, accept);
      } else {
        scope.fail(json, reject);
      }
    });
  };
  scope.checkState = function (data) {
    return promise((accept, reject) => {
      if (localStorage.credit) {
        scope.go(data || {})
          .then(accept);
      } else {
        scope.fail(data || {}, reject);
      }
    });
  };
  app.login = scope.go;
  app.observe('loginStatus', async (newValue) => {
    if (newValue) {
      import 'component/loggedIn/';
    }
    cnsl(`Login State Change ${newValue}`, 'notify');
  });
  pipe.on('client', (json) => {
    app.set('client', json.item);
  });
  app.on('*.logout', scope.logout);
  try {
    await scope.checkState({
      checkMode: true
    });
    console.log('Login Promise Accepted');
  } catch (error) {
    console.log('Login Promise Rejected');
    scope.fail();
  }
  router.loadState();
})();
