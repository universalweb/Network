(async () => {
	const config = require('./config');
	const ractive = globalThis.Ractive;
	const torrent = require('./browser/torrent/');
	const figlet = require('figlet');
	const {
		readFileSync
	} = require('fs');
	const template = readFileSync('./browser/resources/html/template/browser.html').toString();
	const {
		homepage,
		devMode
	} = config.browser;
	const mainComponent = ractive({
		target: 'body',
		template,
		data: {
			newURL: homepage,
			url: homepage,
			load: true,
			torrent: {
				title: 'Torrent & Stream',
				magnet: ''
			}
		},
		onrender() {
			const webview = document.querySelector('webview');
			const that = this;
			webview.addEventListener('did-stop-loading', async (e) => {
				const src = webview.src;
				console.log(src, e);
				await that.set('newURL', src);
				await that.set('url', src);
			});
		}
	});
	window.view = mainComponent;
	mainComponent.on({
		async loadURL() {
			const url = mainComponent.get('newURL');
			await mainComponent.set('url', url);
			await mainComponent.set('load', true);
			console.log('LOADING URL');
			console.log(`URL: ${url}`);
			if (devMode) {
				setTimeout(() => {
					document.querySelector('webview').openDevTools();
				}, 500);
			}
		},
		async refresh() {
			document.querySelector('webview').reload();
		},
		async forward() {
			document.querySelector('webview').goForward();
		},
		async backward() {
			document.querySelector('webview').goBack();
		},
		async home() {
			await this.set('newURL', 'https://social.sentivate.com');
			await this.fire('loadURL');
		},
		urlbar(componentEvent) {
			if (componentEvent.original.keyCode === 13) {
				this.fire('loadURL');
				console.log(componentEvent);
			}
		},
		magnetStream(componentEvent) {
			if (componentEvent.original.keyCode === 13) {
				const magnet = this.get('torrent.magnet');
				torrent.streamPlay(magnet, '#torrentView');
				console.log(componentEvent);
			}
		}
	});
	mainComponent.observe('url', async (newValue) => {
		await mainComponent.set('newURL', newValue);
	});
	torrent.events(mainComponent);
	if (devMode) {
		setTimeout(() => {
			document.querySelector('webview').openDevTools();
		}, 500);
	}
	console.log('MainBrowser Component', ractive);
	figlet('SNTVT', (err, data) => {
		if (!err) {
			console.log(data);
		}
	});
})();
