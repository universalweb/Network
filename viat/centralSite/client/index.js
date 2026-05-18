import './modules/environment.js';
import './modules/plugins-bootstrap.js';
import './modules/registerRoots.js';
import AppView from './modules/app.js';
import { BootScreen } from './components/global/boot-screen/boot-screen.js';
import VIATClientSDK from 'viat';
import { isAgent } from '@universalweb/utilitylib';
import { runPlugins } from './components/core/plugins/registry.js';
console.log('VIAT Central Site - Client');
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
	await app.lifecycle.whenLive;
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
