/* eslint-env node, browser */
(async () => {
	const ract = globalThis.Ractive;
	const response = await fetch('template.html');
	const template = await response.text();
	const ractive = ract({
		target: 'body',
		template,
		data: {
			url: 'localhost',
			port: 8880,
			udsp: false
		}
	});
	globalThis.addEventListener('uws', (eventObject) => {
		console.log(eventObject);
	}, false);
	async function loadUDSP(url) {
		console.log('CONNECTING TO UDSP SERVER');
		const state = await require('./client')(url, 8880);
		const {
			request,
			connect,
			profile: {
				activate: activateProfile
			},
		} = state;
		console.log('CONNECTING TO UDSP SERVER');
		await activateProfile('default');
		await connect();
		const defaultState = await request('state', {
			state: '/'
		});
		console.log(defaultState);
		const iframe = document.querySelector('iframe');
		iframe.contentWindow.request = request;
		console.log(defaultState[0]);
		iframe.contentWindow.eval(defaultState[0].data);
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
				const iframe = document.querySelector('iframe');
				iframe.contentWindow.location.reload(true);
				await loadUDSP(url);
			}
		},
		async refreshURL() {
			await ractive.set('load', false);
			await ractive.set('load', true);
		}
	});
	console.log(ractive);
})();
