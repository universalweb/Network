/*
	DESCRIPTION: ui-date-input — ui-input preset pinned to native type=date.
	ISO `YYYY-MM-DD`. min/max clamp on commit. Emits date-input:change { value }.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-date-input .state.value=${'2026-08-30'} .state.min=${'2026-01-01'}
	    @date-input:change=${this.handleDate}></ui-date-input>
	  <ui-field .state.label=${'Start'}>
	    <ui-date-input></ui-date-input>
	  </ui-field>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import { isString, parseIsoDate } from 'webcomponent';
import { UIInput } from '../input/input.js';
/**
 * Clamp an ISO date onto [min, max] when those bounds parse.
 * @param {string} value - ISO date.
 * @param {string} min - Inclusive lower bound.
 * @param {string} max - Inclusive upper bound.
 * @returns {string} Clamped ISO date, or the original when unparsable.
 */
export function clampIsoDate(value, min, max) {
	if (!isString(value) || value.length < 10) {
		return value;
	}
	const stamp = parseIsoDate(value);
	if (!Number.isFinite(stamp.getTime())) {
		return value;
	}
	if (isString(min) && min.length >= 10) {
		const minStamp = parseIsoDate(min);
		if (Number.isFinite(minStamp.getTime()) && stamp < minStamp) {
			return min.slice(0, 10);
		}
	}
	if (isString(max) && max.length >= 10) {
		const maxStamp = parseIsoDate(max);
		if (Number.isFinite(maxStamp.getTime()) && stamp > maxStamp) {
			return max.slice(0, 10);
		}
	}
	return value.slice(0, 10);
}
export class UIDateInput extends UIInput {
	static url = import.meta.url;
	static styles = {
		dateInput: './date-input.css',
	};
	static state = {
		/* eslint-disable-next-line no-restricted-syntax -- native input type attr */
		type: 'date',
		feature: 'date-input',
	};
	handleChange(domEvent) {
		const field = domEvent.target;
		const next = clampIsoDate(field.value, this.state.min, this.state.max);
		if (next !== field.value) {
			field.value = next;
		}
		if (this.state.value !== next) {
			this.state.value = next;
		}
		super.handleChange(domEvent);
	}
}
customElements.define('ui-date-input', UIDateInput);
