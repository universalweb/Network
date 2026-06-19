/*
	DESCRIPTION: ui-stepper — a multi-step WIZARD progress indicator (MUI "Stepper").
	DISTINCT from ui-number-stepper (the ±  amount control). Renders numbered nodes +
	connectors with done/active/error states; in `linear` mode you can only step back
	to completed nodes, never jump ahead. Indicator only — the consumer owns the step
	panels and advances `active`. Native buttons + unicode glyphs (✓ done, ! error) as
	a pure string, so nothing renders blank.
	── EVENTS ───────────────────────────────────────────────────────────
	  step:change { index }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-stepper .active=${1} .steps=${[
	    { label: 'Account' },
	    { label: 'Details', description: 'Profile & prefs' },
	    { label: 'Review', optional: true },
	  ]} @step:change=${e => goStep(e.detail.data.index)}></ui-stepper>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
const esc = (value) => {
	return String(value).replace(/[&<>"]/g, (char) => {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
		}[char];
	});
};
export class UIStepper extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stepper: './stepper.css',
	};
	static state = {
		steps: [],
		active: 0,
		orientation: 'horizontal',
		linear: true,
		clickable: true,
	};
	goTo(index) {
		if (index === this.state.active) {
			return;
		}
		// Linear wizards only allow stepping back to a completed node.
		if (this.state.linear && index > this.state.active) {
			return;
		}
		this.state.active = index;
		this.emit('step:change', {
			index,
		});
	}
	handleClick(domEvent) {
		if (!this.state.clickable) {
			return;
		}
		const button = domEvent.target.closest('button[data-step]');
		if (!button || button.disabled) {
			return;
		}
		this.goTo(Number(button.dataset.step));
	}
	render() {
		this.html `
			<ol class="stepper" data-orientation=${this.state.orientation} @click=${this.handleClick}>
				^html${this.renderSteps}
			</ol>
		`;
	}
	renderSteps() {
		const steps = Array.isArray(this.state.steps) ? this.state.steps : [];
		const active = Number(this.state.active) || 0;
		let markup = '';
		for (let index = 0; index < steps.length; index += 1) {
			const step = steps[index];
			let status = 'upcoming';
			if (step.error) {
				status = 'error';
			} else if (index < active) {
				status = 'done';
			} else if (index === active) {
				status = 'active';
			}
			const glyph = status === 'done' ? '✓' : status === 'error' ? '!' : String(index + 1);
			const canClick = this.state.clickable && (!this.state.linear || index <= active);
			const optional = step.optional ? '<span class="st-optional">Optional</span>' : '';
			const description = step.description ? `<span class="st-desc">${esc(step.description)}</span>` : '';
			markup += `<li class="st-item" data-status="${status}">
				<button type="button" class="st-step" data-step="${index}"${canClick ? '' : ' disabled'}${index === active ? ' aria-current="step"' : ''}>
					<span class="st-node" aria-hidden="true">${glyph}</span>
					<span class="st-text">
						<span class="st-label">${esc(step.label)}</span>
						${optional}${description}
					</span>
				</button>
			</li>`;
			if (index < steps.length - 1) {
				markup += `<li class="st-connector" data-status="${index < active ? 'done' : 'upcoming'}" aria-hidden="true"></li>`;
			}
		}
		return markup;
	}
}
customElements.define('ui-stepper', UIStepper);
