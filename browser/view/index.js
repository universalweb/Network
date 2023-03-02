// SET FOR REMOVAL
const ractive = globalThis.Ractive;
import { readJson } from '../../utilities/file/index.js';
const config = readJson('./config/index.json');
import { readFileSync } from 'fs';
const template = readFileSync('./browser/resources/html/template/browser.html').toString();
const {
	homepage,
	devMode
} = config.browser;
const mainComponent = ractive({
	target: 'body',
	template,
	data: {
		config,
		newURL: homepage,
		url: homepage,
		load: true,
		torrent: {
			title: 'Stream Torrent',
			magnet: ''
		}
	},
	onrender() {
		const webview = document.querySelector('#webviewMain');
		const that = this;
		webview.addEventListener('did-stop-loading', async (evnt) => {
			console.log(evnt);
			const src = webview.src;
			console.log('did-stop-loading', src);
			await that.set('newURL', src);
			await that.set('url', src);
		});
	}
});
mainComponent.on({
	async loadURL() {
		const url = mainComponent.get('newURL');
		await mainComponent.set('url', url);
		console.log('LOADING URL');
		console.log(`URL: ${url}`);
		if (devMode) {
			setTimeout(() => {
				document.querySelector('#webviewMain').openDevTools();
			}, 500);
		}
	},
	async refresh() {
		document.querySelector('#webviewMain').reload();
	},
	async forward() {
		document.querySelector('#webviewMain').goForward();
	},
	async backward() {
		document.querySelector('#webviewMain').goBack();
	},
	async home() {
		await this.set('newURL', 'uw://universalweb.io');
		await this.fire('loadURL');
	},
	urlbar(componentEvent) {
		if (componentEvent.original.keyCode === 13) {
			this.fire('loadURL');
			console.log(componentEvent);
		}
	}
});
window.view = mainComponent;
console.log('MainBrowser Component', mainComponent);
export default mainComponent;
