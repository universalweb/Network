import './modules/environment.js';
import './modules/plugins-bootstrap.js';
import './modules/registerRoots.js';
import AppView from './modules/app.js';
import { BootScreen } from './components/global/boot-screen/boot-screen.js';
import VIATClientSDK from 'viat';
import { isAgent } from '@universalweb/utilitylib';
import { runPlugins } from './components/core/plugins/registry.js';
console.log('VIAT Central Site - Client');
// The boot-screen mark — the animated VIAT "V". Supplied as the logo so the
// global <boot-screen> component stays a content-free base slate.
const VIAT_BOOT_LOGO = `
	<svg class="bs-mark" viewBox="0 0 64 64" fill="none" stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter">
		<defs>
			<linearGradient id="bs-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
				<stop offset="0%" stop-color="#c4b5fd">
					<animate attributeName="stop-color" values="#c4b5fd;#5eead4;#60a5fa;#f0abfc;#c4b5fd" dur="8s" repeatCount="indefinite"></animate>
				</stop>
				<stop offset="50%" stop-color="#5eead4">
					<animate attributeName="stop-color" values="#5eead4;#f0abfc;#c4b5fd;#60a5fa;#5eead4" dur="8s" repeatCount="indefinite"></animate>
				</stop>
				<stop offset="100%" stop-color="#60a5fa">
					<animate attributeName="stop-color" values="#60a5fa;#c4b5fd;#f0abfc;#5eead4;#60a5fa" dur="8s" repeatCount="indefinite"></animate>
				</stop>
				<animateTransform attributeName="gradientTransform" type="rotate" from="0 32 32" to="360 32 32" dur="14s" repeatCount="indefinite"></animateTransform>
			</linearGradient>
		</defs>
		<path class="bs-leg bs-leg-left" fill="url(#bs-grad)" d="M 11.54 15.23 L 16.46 12.77 L 32 43.85 L 32 56.14 Z"></path>
		<path class="bs-leg bs-leg-right" fill="url(#bs-grad)" d="M 52.46 15.23 L 47.54 12.77 L 32 43.85 L 32 56.14 Z"></path>
		<line class="bs-dash" stroke="url(#bs-grad)" x1="16" y1="32" x2="48" y2="32"></line>
	</svg>
`;
async function mountBootScreen() {
	const bootScreen = new BootScreen({
		title: 'Welcome to Viat',
		subtitle: 'Command and Control Terminal',
		logo: VIAT_BOOT_LOGO,
		barState: {
			indeterminate: true,
			label: 'Loading Viat',
		},
	});
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
