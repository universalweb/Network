// Writes globalState.environment.locale and listens for languagechange.
import { setGlobal } from '../state/globalState.js';
function snapshot() {
	return {
		language: navigator.language,
		languages: [...(navigator.languages || [navigator.language])],
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}
function update() {
	const value = snapshot();
	setGlobal({ 'environment.locale': value });
	document.dispatchEvent(new CustomEvent('environment:change', {
		bubbles: true,
		composed: true,
		detail: { data: { area: 'locale', value } },
	}));
}
window.addEventListener('languagechange', update);
update();
