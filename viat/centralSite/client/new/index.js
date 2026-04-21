import AppView from './modules/app.js';
const getGlobal = (typeof globalThis === 'undefined') ? window : globalThis;
async function initialize() {
	console.log('APP LOADING');
	const app = await AppView.create();
	getGlobal.AppView = app;
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
