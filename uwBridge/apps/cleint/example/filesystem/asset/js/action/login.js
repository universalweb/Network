(async () => {
  const {
    router,
    request,
    utility: {
      jsonParse,
      stringify,
      ifInvoke,
      promise,
      cnsl
    },
    workerRequest,
    watch,
    view
  } = app;
  cnsl('login model', 'notify');
  let creditCheck = localStorage.credit;
  exports.success = function(json, accept) {
    cnsl('login success', 'notify');
    console.log(json);
    if (json.credit) {
      const credit = json.credit;
      $.credit = credit;
      localStorage.credit = stringify(credit);
      workerRequest('credit', credit);
    } else if (localStorage.credit) {
      $.credit = jsonParse(localStorage.credit);
    }
    view.set('loginStatus', true);
    creditCheck = $.credit;
    ifInvoke(accept, json);
  };
  exports.fail = function(data, reject) {
    cnsl('login failure', 'notify');
    localStorage.removeItem('credit');
    $.credit = null;
    view.set('profile', false);
    view.set('loginStatus', false);
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
  exports.logout = async function() {
    await request('user.logout', {});
    exports.fail();
  };
  exports.go = function(data) {
    const credit = (localStorage.credit) ? {
      credit: jsonParse(localStorage.credit)
    } : false;
    if (!credit && !data) {
      return;
    } else if (credit) {
      workerRequest('credit', credit);
    }
    return promise(async (accept, reject) => {
      const json = await request('user.verify', credit || data);
      console.log(json);
      if (json.loginStatus) {
        exports.success(json, accept);
      } else {
        exports.fail(json, reject);
      }
    });
  };
  exports.checkState = function(data) {
    return promise((accept, reject) => {
      if (localStorage.credit) {
        exports.go(data || {})
          .then(accept);
      } else {
        exports.fail(data || {}, reject);
      }
    });
  };
  app.login = exports.go;
  view.observe('loginStatus', async (newValue) => {
    if (newValue) {
      import 'component/loggedIn/';
    }
    cnsl(`Login State Change ${newValue}`, 'notify');
  });
  watch('client', (json) => {
    view.set('client', json.item);
  });
  view.on('*.logout', exports.logout);
  try {
    await exports.checkState({
      checkMode: true
    });
    console.log('Login Promise Accepted');
  } catch (error) {
    console.log('Login Promise Rejected');
    exports.fail();
  }
})();
