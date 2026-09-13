/*
	DESCRIPTION: ui-time-input — ui-input preset pinned to native type=time.
	Canonical `HH:MM` 24h. `step` is the native seconds grid (HTML). Commit
	snaps onto that grid via core snapTo and clamps to min/max.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-time-input .state.value=${'09:30'} .state.step=${'300'}
	    @time-input:change=${this.handleTime}></ui-time-input>
	  <ui-field .state.label=${'Start'}>
	    <ui-time-input></ui-time-input>
	  </ui-field>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import {
	clampToDay,
	formatTime,
	isString,
	MINUTES_PER_DAY,
	parseTime,
	snapTo,
} from 'webcomponent';
import { UIInput } from '../input/input.js';
/**
 * Native `step` is seconds. snapTo wants minutes.
 * @param {string|number} step - Native step attribute.
 * @returns {number} Grid size in minutes.
 */
function stepMinutes(step) {
	const seconds = Number(step);
	if (!Number.isFinite(seconds) || seconds <= 0) {
		return 1;
	}
	return seconds / 60;
}
/**
 * Snap a clock string onto the step grid and clamp to min/max.
 * @param {string} value - `HH:MM`.
 * @param {string|number} step - Native seconds step.
 * @param {string} min - Inclusive lower clock.
 * @param {string} max - Inclusive upper clock.
 * @returns {string} Quantised clock, or the original when unparsable.
 */
export function quantizeClock(value, step, min, max) {
	const minutes = parseTime(value);
	if (!Number.isFinite(minutes)) {
		return value;
	}
	let next = snapTo(minutes, stepMinutes(step));
	next = clampToDay(next);
	if (next >= MINUTES_PER_DAY) {
		next = MINUTES_PER_DAY - 1;
	}
	if (isString(min) && min) {
		const minMinutes = parseTime(min);
		if (Number.isFinite(minMinutes) && next < minMinutes) {
			next = minMinutes;
		}
	}
	if (isString(max) && max) {
		const maxMinutes = parseTime(max);
		if (Number.isFinite(maxMinutes) && next > maxMinutes) {
			next = maxMinutes;
		}
	}
	return formatTime(next);
}
export class UITimeInput extends UIInput {
	static url = import.meta.url;
	static styles = {
		timeInput: './time-input.css',
	};
	static state = {
		/* eslint-disable-next-line no-restricted-syntax -- native input type attr */
		type: 'time',
		feature: 'time-input',
	};
	onConnect() {
		super.onConnect();
		this.observe('value', this.applyQuantize);
	}
	applyQuantize() {
		const next = quantizeClock(this.state.value, this.state.step, this.state.min, this.state.max);
		if (next !== this.state.value) {
			this.state.value = next;
		}
	}
	handleChange(domEvent) {
		const field = domEvent.target;
		const next = quantizeClock(field.value, this.state.step, this.state.min, this.state.max);
		if (next !== field.value) {
			field.value = next;
		}
		if (this.state.value !== next) {
			this.state.value = next;
		}
		super.handleChange(domEvent);
	}
}
customElements.define('ui-time-input', UITimeInput);
