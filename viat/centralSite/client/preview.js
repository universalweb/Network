import './modules/config.js';
import { AppView } from './components/user/app-view/app-view.js';
import PreviewView from './modules/preview.js';
/*
 * Preview mounts the standard <app-shell> like every other page — it owns the
 * SDK singleton + the `notify` toast stack — and slots the gallery into it.
 */
async function initialize() {
	console.log('PREVIEW LOADING');
	const shell = new AppView();
	document.body.appendChild(shell);
	const preview = await PreviewView.create(undefined, undefined, shell);
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
