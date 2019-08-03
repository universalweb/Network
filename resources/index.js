(async () => {
	const ract = globalThis.Ractive;
	const response = await fetch('./resources/template.html');
	const template = await response.text();
	const ractive = ract({
		target: 'body',
		template,
		data: {
			url: 'uw://localhost',
			port: 8880,
			udsp: false
		}
	});
	ractive.on({
		async loadURL() {
			const url = ractive.get('url');
			const port = ractive.get('port');
			console.log('LOADING URL');
			console.log(`URL: ${url}`);
			console.log(`PORT: ${port}`);
			await ractive.set('load', true);
			setTimeout(() => {
				document.querySelector('webview').openDevTools();
			}, 500);
		},
		async refreshURL() {
			await ractive.set('load', false);
			await ractive.set('load', true);
		}
	});
	console.log(ractive);
})();
