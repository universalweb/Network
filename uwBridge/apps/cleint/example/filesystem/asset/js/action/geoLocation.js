(async () => {
  const {
    request,
    view,
    utility: {
      pick
    }
  } = app;
  console.log('geoLocation model');
  exports.updatePositionObject = function(crd) {
    app.position = pick(crd, ['speed', 'longitude', 'latitude', 'heading', 'accuracy', 'altitude', 'altitudeAccuracy']);
  };
  /*
  	If login was verified
  */
  exports.updateLocation = async function() {
    if ($.position) {
      const json = await request('user.updateGeoLocation', $.position);
      window.console.log(json);
    }
  };
  function success(pos) {
    const crd = pos.coords;
    exports.updatePositionObject(crd);
    console.log('Your current position is:', crd);
    view.observe('loginStatus', (newValue) => {
      if (newValue) {
        exports.updateLocation();
      }
    });
  }
  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }
  // navigator.geolocation.getCurrentPosition(success, error, options);
  function removeCookie(cookie) {
    const lurl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
    win.cookies.remove({
      url: lurl,
      name: cookie.name
    }, (result) => {
      if (result) {
        if (!result.name) {
          result = result[0];
        } // in devTools it looked like the result was an array
        console(`cookie remove callback: ${result.name} ${result.url}`);
      } else {
        console('cookie removal failed');
      }
    });
  }
  app.removeCache = () => {
    win.cookies.getAll({}, (cookies) => {
      cookies.forEach((cookie) => {
        removeCookie(cookie);
      });
    });
  };
})();
