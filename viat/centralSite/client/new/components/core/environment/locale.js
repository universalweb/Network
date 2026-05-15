// Writes globalState.environment.locale and listens for languagechange.
import { plainEqual } from '../utilities.js';
import { setGlobal } from '../state/globalState.js';
let lastSnapshot = null;
function snapshot() {
	return {
		language: navigator.language,
		languages: [...(navigator.languages || [navigator.language])],
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}
function update() {
	const value = snapshot();
	if (plainEqual(lastSnapshot, value)) {
		return;
	}
	lastSnapshot = value;
	setGlobal({ 'environment.locale': value });
	document.dispatchEvent(new CustomEvent('environment:change', {
		bubbles: true,
		composed: true,
		detail: { data: { area: 'locale', value } },
	}));
}
globalThis.addEventListener('languagechange', update);
update();
