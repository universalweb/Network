// Opt-in battery info. Call requestBattery() once to start tracking.
// navigator.getBattery() is deprecated in some browsers — gracefully
// no-ops if unavailable.
import { setGlobal } from '../state/globalState.js';
let manager = null;
function snapshot() {
	if (!manager) {
		return null;
	}
	return {
		level: manager.level,
		charging: manager.charging,
		chargingTime: manager.chargingTime,
		dischargingTime: manager.dischargingTime,
	};
}
function update() {
	const value = snapshot();
	setGlobal({ 'environment.battery': value });
	document.dispatchEvent(new CustomEvent('environment:change', {
		bubbles: true,
		composed: true,
		detail: { data: { area: 'battery', value } },
	}));
}
export async function requestBattery() {
	if (manager || typeof navigator.getBattery !== 'function') {
		return manager;
	}
	manager = await navigator.getBattery();
	['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'].forEach((eventName) => {
		manager.addEventListener(eventName, update);
	});
	update();
	return manager;
}
