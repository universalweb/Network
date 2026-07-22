/*
 * Entry — boot splash FIRST, then dynamic-load the rest of the app.
 *
 * Static imports here are intentionally lean: only config + BootScreen so the
 * splash can paint before AppView / SDK / user components start downloading.
 * Everything else is dynamic-imported inside the boot pipeline after the
 * splash is live (see modules/boot-pipeline.js).
 */
import './modules/config.js';
import { BootScreen } from './components/global/boot-screen/boot-screen.js';
import { BootPipeline } from './modules/boot-pipeline.js';
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
		<path class="bs-leg bs-leg-left" fill="url(#bs-grad)" d="M 11.54 15.23 L 16.46 12.77 L 32.8 43.85 L 32 56.14 Z"></path>
		<path class="bs-leg bs-leg-right" fill="url(#bs-grad)" d="M 52.46 15.23 L 47.54 12.77 L 31.2 43.85 L 32 56.14 Z"></path>
		<line class="bs-dash" stroke="url(#bs-grad)" x1="16" y1="32" x2="48" y2="32"></line>
	</svg>
`;
async function mountBootScreen() {
	const bootScreen = new BootScreen({
		heading: 'WELCOME TO VIAT',
		subheading: 'Command and Control Terminal',
		extraSubheading: 'LOCAL AI ENABLED',
		logo: VIAT_BOOT_LOGO,
		barState: {
			indeterminate: true,
			label: 'Loading Viat',
		},
	});
	document.body.appendChild(bootScreen);
	return bootScreen;
}
/**
 * Dynamic-import the app tree only after the splash is mounted.
 * Marks pipeline phases so callers can `pipeline.waitFor('app-ready')` etc.
 * @param {BootPipeline} pipeline
 */
async function loadApp(pipeline) {
	pipeline.bootScreen?.setStatus('Loading environment');
	// Parallel module graph: env / plugins registry side-effects / roots / AppView.
	// plugins-bootstrap only registers; runPlugins() is ordered after imports settle.
	const [
		_env,
		_pluginsBootstrap,
		_roots,
		pluginsRegistry,
		appModule,
	] = await Promise.all([
		import('./modules/environment.js'),
		import('./modules/plugins-bootstrap.js'),
		import('./modules/registerRoots.js'),
		import('./components/core/plugins/registry.js'),
		import('./modules/app.js'),
	]);
	pipeline.mark('modules-loaded');
	pipeline.bootScreen?.setStatus('Running plugins');
	await pluginsRegistry.runPlugins();
	pipeline.mark('plugins-ran');
	pipeline.bootScreen?.setStatus('Rendering app');
	const AppView = appModule.default;
	// Pre-render under the splash (opacity 0, no fade) so whenLive means the
	// full tree is painted + live before we ever drop the boot screen.
	const app = await AppView.create(undefined, undefined, {
		mount: document.body,
		fade: false,
	});
	pipeline.app = app;
	// Debug handle is lowercase `app` on purpose — a `globalThis.AppView`
	// holding the INSTANCE would collide with the AppView class, so any
	// non-importing `AppView.ensureSDK()` would hit the instance getter
	// instead of the static. Keep the class name free of a global shadow.
	globalThis.app = app;
	pipeline.mark('app-ready');
	// preRender already appended; mark explicitly so waiters can key on it.
	pipeline.mark('app-appended');
	return app;
}
async function initialize() {
	console.log('APP LOADING');
	const pipeline = new BootPipeline({
		mountBoot: mountBootScreen,
		loadApp,
	});
	// Observable from the console / other modules: globalThis.boot.phase, waitFor, etc.
	globalThis.boot = pipeline;
	const app = await pipeline.run();
	return app;
}
async function onReady() {
	console.log('Doc state', document.readyState);
	if (document.readyState === 'loading') {
		await new Promise((resolve) => {
			document.addEventListener('DOMContentLoaded', resolve, {
				once: true,
			});
		});
	}
	await initialize();
}
await onReady();
