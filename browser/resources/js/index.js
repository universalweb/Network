(async () => {
	const ract = globalThis.Ractive;
	const response = await fetch('./browser/resources/html/template/browser.html');
	const template = await response.text();
	const ractive = ract({
		target: 'body',
		template,
		data: {
			newURL: 'uw://localhost',
			url: 'uw://localhost',
			load: true
		}
	});
	window.view = ractive;
	ractive.on({
		async loadURL() {
			const url = ractive.get('newURL');
			await ractive.set('url', url);
			await ractive.set('load', true);
			console.log('LOADING URL');
			console.log(`URL: ${url}`);
			setTimeout(() => {
				document.querySelector('webview').openDevTools();
			}, 500);
		},
		async refreshURL() {
			document.querySelector('webview').reload();
		},
		keyup(componentEvent) {
			if (componentEvent.original.keyCode === 13) {
				ractive.fire('loadURL');
				console.log(componentEvent);
			}
		}
	});
	setTimeout(() => {
		document.querySelector('webview').openDevTools();
	}, 500);
	console.log('MainBrowser Componenet', ractive);
})();
