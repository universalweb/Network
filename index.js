/* eslint-env node, browser */
(async () => {
	const ract = window.Ractive;
	const response = await fetch('template.html');
	const template = await response.text();
	const ractive = ract({
		target: 'body',
		template,
		data: {
			url: 'localhost',
			port: 8080,
			udsp: false
		}
	});
	async function loadUDSP(url) {
		console.log('CONNECTING TO UDSP SERVER');
		const state = await require('./client')(url, 8080);
		const {
			profile: {
				activate: activateProfile
			},
		} = state;
		console.log('CONNECTING TO UDSP SERVER');
		await activateProfile('default');
		const {
			request,
			api: {
				connect
			}
		} = state;
		const handshake = await connect('localhost', 8080);
		console.log(handshake);
		const indexFile = await request('file', {
			path: 'index.html'
		});
		console.log(indexFile);
		return indexFile;
	}
	ractive.on({
		async loadURL() {
			const url = ractive.get('url');
			const port = ractive.get('port');
			console.log('LOADING URL');
			console.log(`URL: ${url}`);
			console.log(`PORT: ${port}`);
			await ractive.set('load', true);
			if (url.includes('https:')) {
				await ractive.set('udsp', false);
			} else {
				await ractive.set('udsp', true);
				const returned = await loadUDSP(url);
				const iframe = document.querySelector('iframe');
				console.log(returned[0].data);
				iframe.contentWindow.document.body.innerHTML = returned[0].data;
			}
		},
		async refreshURL() {
			await ractive.set('load', false);
			await ractive.set('load', true);
		}
	});
	console.log(ractive);
})();
