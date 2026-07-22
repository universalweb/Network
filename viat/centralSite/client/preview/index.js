import '../modules/config.js';
import { AppShell } from '../components/global/app-shell/app-shell.js';
import PreviewView from './preview.js';
/*
 * Preview mounts a BARE <app-shell> — the SDK-free base that owns the `notify`
 * toast stack and viewport reflection — and slots the gallery into it. It does
 * NOT use the wallet's <app-view> (modules/app.js) or the `viat` SDK: only the
 * wallet page needs those.
 */
async function initialize() {
	console.log('PREVIEW LOADING');
	const shell = new AppShell();
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
