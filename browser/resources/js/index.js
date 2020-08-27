(async () => {
	const torrent = require('./browser/torrent/');
	const mainView = require('./browser/view/');
	const figlet = require('figlet');
	mainView();
	const mainComponent = window.view;
	torrent.events(mainComponent);
	figlet('Universal Web', (err, data) => {
		if (!err) {
			console.log(data);
		}
	});
})();
