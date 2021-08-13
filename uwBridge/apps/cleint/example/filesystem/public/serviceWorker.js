self.addEventListener('install', function (event) {
	console.log('Service worker install');
	this.addEventListener('fetch', function (event) {
		//console.log(event);
	});
});
