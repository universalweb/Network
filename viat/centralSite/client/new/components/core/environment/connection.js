// navigator.connection (Network Information API). Self-init when imported.
// Chromium-only at the moment; gracefully no-ops elsewhere.
import { plainEqual } from '../utilities.js';
import { setGlobal } from '../state/globalState.js';
const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
let lastSnapshot = null;
function snapshot() {
	if (!conn) {
		return null;
	}
	return {
		type: conn.effectiveType ?? null,
		downlink: conn.downlink ?? null,
		rtt: conn.rtt ?? null,
		saveData: conn.saveData ?? false,
	};
}
function update() {
	const value = snapshot();
	if (plainEqual(lastSnapshot, value)) {
		return;
	}
	lastSnapshot = value;
	setGlobal({ 'environment.connection': value });
	document.dispatchEvent(new CustomEvent('environment:change', {
		bubbles: true,
		composed: true,
		detail: { data: { area: 'connection', value } },
	}));
}
if (conn) {
	conn.addEventListener('change', update);
}
update();
