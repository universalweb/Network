// Writes globalState.environment.locale and listens for languagechange.
import { emitDelegate } from '../dom/delegate.js';
import { plainEqual } from '../utilities.js';
import { globalState } from '../state/globalState.js';
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
	globalState.set({ 'environment.locale': value });
	emitDelegate('environment:change', { area: 'locale', value });
}
globalThis.addEventListener('languagechange', update);
update();
