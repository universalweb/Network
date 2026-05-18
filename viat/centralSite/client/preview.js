import PreviewView from './modules/preview.js';
async function initialize() {
	console.log('PREVIEW LOADING');
	const preview = await PreviewView.create();
	globalThis.PreviewView = preview;
	return preview;
}
async function onReady() {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		await initialize();
	}
}
await onReady();
