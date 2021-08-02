(async function () {
  const scope = $.geoLocation = exports;
  const {
    pick
  } = app;
  console.log('geoLocation model');
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  scope.updatePositionObject = function (crd) {
    $.position = pick(['speed', 'longitude', 'latitude', 'heading', 'accuracy', 'altitude', 'altitudeAccuracy'], crd);
  };
  /*
  	If login was verified
  */
  scope.updateLocation = async function () {
    if ($.position) {
      const json = await request('user.updateGeoLocation', $.position);
      window.console.log(json);
    }
  };

  function success(pos) {
    const crd = pos.coords;
    scope.updatePositionObject(crd);
    console.log('Your current position is:', crd);
    app.observe('loginStatus', (newValue) => {
      if (newValue) {
        scope.updateLocation();
      }
    });
  };

  function error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
  };
  //navigator.geolocation.getCurrentPosition(success, error, options);
  function removeCookie(cookie) {
    var lurl = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
    win.cookies.remove({
      url: lurl,
      name: cookie.name
    }, function (result) {
      if (result) {
        if (!result.name) {
          result = result[0];
        } // in devTools it looked like the result was an array
        console('cookie remove callback: ' + result.name + ' ' + result.url);
      } else {
        console('cookie removal failed');
      }
    });
  }
  $.removeCache = () => {
    win.cookies.getAll({}, function (cookies) {
      cookies.forEach(function (cookie) {
        removeCookie(cookie);
      })
    });
  }
})();
