(async () => {
	const {
		request,
		view,
		utility: { pick }
	} = app;
	console.log('geoLocation model');
	exports.updatePositionObject = function(crd) {
		app.position = pick(crd, ['speed', 'longitude', 'latitude', 'heading', 'accuracy', 'altitude', 'altitudeAccuracy']);
	};
	/*
  	If login was verified
  */
	exports.updateLocation = async function() {
		if (app.position && app.view.get('@shared.geoquery') === 'granted') {
			const json = await request('open.updateGeoLocation', app.position);
			console.log(json);
		}
	};
	function success(pos) {
		const crd = pos.coords;
		exports.updatePositionObject(crd);
		exports.updateLocation();
		console.log('Your current position is:', crd);
		view.observe('@shared.loginStatus', (newValue) => {
			if (newValue && app.view.get('@shared.geoquery') === 'granted') {
				exports.updateLocation();
			}
		});
	}
	function error(err) {
		console.warn(`ERROR(${err.code}): ${err.message}`);
	}
	async function handlePermission() {
		const geoLocationQuery = await navigator.permissions.query({
			name: 'geolocation'
		});
		app.view.set('@shared.geoquery', geoLocationQuery.state);
		if (geoLocationQuery.state === 'granted') {
			console.log(geoLocationQuery);
		} else if (geoLocationQuery.state === 'prompt') {
			console.log(geoLocationQuery);
			navigator.geolocation.getCurrentPosition(success, error, {});
		} else if (geoLocationQuery.state === 'denied') {
			console.log(geoLocationQuery);
		}
		app.view.fire('geoquery.change');
		geoLocationQuery.onchange = function() {
			app.view.set('@shared.geoquery', geoLocationQuery.state);
			app.view.fire('geoquery.change');
		};
	  }
	  handlePermission();
})();
