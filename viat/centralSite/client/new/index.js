import './modules/environment.js';
import './modules/plugins-bootstrap.js';
import { runPlugins } from './components/core/plugins/registry.js';
import AppView from './modules/app.js';
async function initialize() {
	console.log('APP LOADING');
	await runPlugins();
	const app = await AppView.create();
	globalThis.AppView = app;
	return app;
}
async function onReady() {
	// Add event to execute when the document body is ready
	console.log('Doc state', document.readyState);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		await initialize();
	}
}
await onReady();
