/*
	DESCRIPTION: ui-questionnaire — single / multi / stepped question flow.
	Composes ui-radio-group (single), ui-checkbox (multi), ui-stepper (step).
	── EVENTS ───────────────────────────────────────────────────────────
	  questionnaire:change { value, values, index }
	  questionnaire:complete { value, values, answers }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-questionnaire
	    .state.variant=${'single'}
	    .state.heading=${'Pick a plan'}
	    .state.items=${[{ value: 'pro', label: 'Pro' }]}
	    @questionnaire:change=${this.onPick}></ui-questionnaire>
	─────────────────────────────────────────────────────────────────────
*/
import '../radio-group/radio-group.js';
import '../stepper/stepper.js';
import { isArray } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { UICheckbox } from '../checkbox/checkbox.js';
const VARIANTS = new Set([
	'single',
	'multi',
	'step',
]);
function normalizeVariant(variant) {
	return VARIANTS.has(variant) ? variant : 'single';
}
export class UIQuestionnaire extends WebComponent {
	static url = import.meta.url;
	static styles = {
		questionnaire: './questionnaire.css',
	};
	static state = {
		variant: 'single',
		heading: '',
		// Options for single / multi: [{ value, label, description? }]
		items: [],
		// Step questions: [{ id, label, items: [{ value, label }] }]
		questions: [],
		value: '',
		values: [],
		activeIndex: 0,
		stepItems: [],
		currentItems: [],
		answers: [],
	};
	onConnect() {
		this.observe([
			'variant',
			'questions',
			'items',
			'activeIndex',
			'values',
		], this.syncDerived);
		this.syncDerived();
	}
	syncDerived() {
		const variant = normalizeVariant(this.state.variant);
		if (variant === 'multi') {
			this.state.stepItems = [];
			this.state.currentItems = this.checksFor(this.state.items);
			return;
		}
		if (variant !== 'step') {
			this.state.currentItems = isArray(this.state.items) ? this.state.items : [];
			this.state.stepItems = [];
			return;
		}
		const questions = isArray(this.state.questions) ? this.state.questions : [];
		const count = questions.length;
		const steps = [];
		for (let index = 0; index < count; index += 1) {
			const question = questions[index];
			steps.push({
				id: question.id || index,
				label: question.label || `Step ${index + 1}`,
			});
		}
		this.state.stepItems = steps;
		const active = Math.max(0, Math.min(count - 1, Number(this.state.activeIndex) || 0));
		const current = questions[active];
		this.state.currentItems = isArray(current?.items) ? current.items : [];
	}
	checksFor(source) {
		const items = isArray(source) ? source : [];
		const values = isArray(this.state.values) ? this.state.values : [];
		const next = [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index] || {};
			const value = item.value ?? item.id ?? '';
			next.push({
				id: value || index,
				value,
				label: item.label || String(value),
				description: item.description || '',
				checked: values.includes(value),
			});
		}
		return next;
	}
	variantFlag() {
		return normalizeVariant(this.state.variant);
	}
	isSingle() {
		return this.variantFlag() === 'single';
	}
	isMulti() {
		return this.variantFlag() === 'multi';
	}
	isStep() {
		return this.variantFlag() === 'step';
	}
	hideStepper() {
		return !this.isStep();
	}
	hideRadio() {
		return this.isMulti();
	}
	hideChecks() {
		return !this.isMulti();
	}
	hidePager() {
		return !this.isStep();
	}
	currentHeading() {
		if (this.isStep()) {
			const questions = this.state.questions;
			const active = Number(this.state.activeIndex) || 0;
			return questions[active]?.label || this.state.heading;
		}
		return this.state.heading;
	}
	hideHeading() {
		return !this.currentHeading();
	}
	handleRadioChange(domEvent) {
		const value = domEvent.detail?.data?.value ?? '';
		this.state.value = value;
		this.emitChange();
	}
	handleCheckChange(domEvent) {
		const data = domEvent.detail?.data;
		const optionValue = data?.value;
		if (optionValue == null) {
			return;
		}
		const checked = data.checked === true;
		const next = this.state.values.slice();
		const at = next.indexOf(optionValue);
		if (checked && at === -1) {
			next.push(optionValue);
		} else if (!checked && at !== -1) {
			next.splice(at, 1);
		}
		this.state.values = next;
		this.emitChange();
	}
	handleStepChange(domEvent) {
		const index = Number(domEvent.detail?.data?.index);
		if (!Number.isFinite(index)) {
			return;
		}
		this.commitStepAnswer();
		this.state.activeIndex = index;
		this.restoreStepValue();
	}
	commitStepAnswer() {
		const answers = this.state.answers.slice();
		const index = Number(this.state.activeIndex) || 0;
		answers[index] = this.state.value;
		this.state.answers = answers;
	}
	restoreStepValue() {
		const index = Number(this.state.activeIndex) || 0;
		this.state.value = this.state.answers[index] || '';
	}
	handleNext() {
		this.commitStepAnswer();
		const last = (this.state.questions.length || 1) - 1;
		if (this.state.activeIndex >= last) {
			this.emit('questionnaire:complete', {
				value: this.state.value,
				values: this.state.values,
				answers: this.state.answers,
			});
			return;
		}
		this.state.activeIndex += 1;
		this.restoreStepValue();
	}
	handleBack() {
		this.commitStepAnswer();
		if (this.state.activeIndex <= 0) {
			return;
		}
		this.state.activeIndex -= 1;
		this.restoreStepValue();
	}
	emitChange() {
		this.emit('questionnaire:change', {
			value: this.state.value,
			values: this.state.values,
			index: this.state.activeIndex,
		});
	}
	nextLabel() {
		const last = (this.state.questions.length || 1) - 1;
		return this.state.activeIndex >= last ? 'Finish' : 'Next';
	}
	backDisabled() {
		return this.state.activeIndex <= 0;
	}
	render() {
		this.html`
			<div class="qn" data-variant=${this.variantFlag}>
				<div class="qn-head" ?hidden=${this.hideHeading}>${this.currentHeading}</div>
				<ui-stepper
					?hidden=${this.hideStepper}
					.state.items=${this.state.stepItems}
					.state.activeIndex=${this.state.activeIndex}
					@stepper:change=${this.handleStepChange}></ui-stepper>
				<ui-radio-group
					?hidden=${this.hideRadio}
					.state.items=${this.state.currentItems}
					.state.value=${this.state.value}
					@radio-group:change=${this.handleRadioChange}></ui-radio-group>
				<div class="qn-multi" ?hidden=${this.hideChecks} @checkbox:change=${this.handleCheckChange}>
					${this.list('currentItems', UICheckbox)}
				</div>
				<div class="qn-pager" ?hidden=${this.hidePager}>
					<button type="button" class="qn-btn" ?disabled=${this.backDisabled} @click=${this.handleBack}>Back</button>
					<button type="button" class="qn-btn qn-next" @click=${this.handleNext}>${this.nextLabel}</button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-questionnaire', UIQuestionnaire);
