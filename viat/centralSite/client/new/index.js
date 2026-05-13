import './modules/environment.js';
import './modules/plugins-bootstrap.js';
import AppView from './modules/app.js';
import { BootScreen } from './components/global/boot-screen/boot-screen.js';
import { isAgent } from '@universalweb/utilitylib';
import VIATClientSDK from 'viat';
import { runPlugins } from './components/core/plugins/registry.js';
console.log('VIAT Central Site - Client');
console.log('UTILITYLIB VERSION', isAgent());
async function mountBootScreen() {
	const bootScreen = new BootScreen();
	document.body.appendChild(bootScreen);
	return bootScreen;
}
async function initialize() {
	console.log('APP LOADING');
	const bootScreen = await mountBootScreen();
	await runPlugins();
	const app = await AppView.create();
	globalThis.AppView = app;
	await app.whenLive;
	bootScreen.dismiss();
	return app;
}
async function onReady() {
	console.log('Doc state', document.readyState);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		await initialize();
	}
}
await onReady();
