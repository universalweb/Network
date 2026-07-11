/*
	DESCRIPTION: ui-stepper — a multi-step WIZARD progress indicator (MUI "Stepper").
	DISTINCT from ui-number-stepper (the ± amount control). Renders numbered nodes +
	connectors with done/active/error states; in `linear` mode you can only step back
	to completed nodes, never jump ahead. Indicator only — the consumer owns the step
	panels and advances `activeIndex`.
	Items render via `list('items', this.stepRow)` (light html rows — auto-escaped
	labels/descriptions; no escapeHtml / `^html` string builder). Connectors are
	positional CSS (`:not(:last-child)::after`), not per-item list entries.
	Shared single-select chrome (`status` / `glyph` / `canClick`) is written onto
	the bound items at observe-time (tabs pattern) so list rows patch without a
	per-render enrichment map.
	── EVENTS ───────────────────────────────────────────────────────────
	  stepper:change { index }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-stepper .state.activeIndex=${1} .state.items=${[
	    { label: 'Account' },
	    { label: 'Details', description: 'Profile & prefs' },
	    { label: 'Review', optional: true },
	  ]} @stepper:change=${e => goStep(e.detail.data.index)}></ui-stepper>
	──────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
export class UIStepper extends WebComponent {
	static url = import.meta.url;
	static styles = {
		stepper: './stepper.css',
	};
	static state = {
		items: [],
		activeIndex: 0,
		orientation: 'horizontal',
		linear: true,
		clickable: true,
	};
	onConnect() {
		this.observe('activeIndex', this.syncStepMeta);
		this.observe('items', this.syncStepMeta);
		this.observe('linear', this.syncStepMeta);
		this.observe('clickable', this.syncStepMeta);
		this.syncStepMeta();
	}
	/* Deep-write display flags onto bound items (tabs-style). List rows patch via
	   the items key; never a per-render map in render(). */
	syncStepMeta() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			return;
		}
		const active = Number(this.state.activeIndex) || 0;
		const count = items.length;
		const clickable = this.state.clickable;
		const linear = this.state.linear;
		for (let index = 0; index < count; index += 1) {
			const step = items[index];
			let status = 'upcoming';
			if (step.error) {
				status = 'error';
			} else if (index < active) {
				status = 'done';
			} else if (index === active) {
				status = 'active';
			}
			step.status = status;
			step.stepIndex = index;
			let glyph = String(index + 1);
			if (status === 'done') {
				glyph = '✓';
			} else if (status === 'error') {
				glyph = '!';
			}
			step.glyph = glyph;
			step.canClick = clickable && (!linear || index <= active);
			step.connectorDone = index < active;
		}
	}
	goTo(index) {
		if (index === this.state.activeIndex) {
			return;
		}
		// Linear wizards only allow stepping back to a completed node.
		if (this.state.linear && index > this.state.activeIndex) {
			return;
		}
		this.state.activeIndex = index;
		this.emit('stepper:change', {
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
	/* Light html row — plain values only (nested html`` stringifies as TEXT). */
	stepRow(item) {
		const optionalLabel = item.optional ? 'Optional' : '';
		const description = item.description || '';
		return html`<li class="st-item" data-status=${item.status || 'upcoming'} data-connector=${item.connectorDone ? 'done' : 'upcoming'}>
			<button type="button" class="st-step" data-step=${item.stepIndex}
				?disabled=${!item.canClick}
				aria-current=${item.status === 'active' ? 'step' : false}>
				<span class="st-node" aria-hidden="true">${item.glyph}</span>
				<span class="st-text">
					<span class="st-label">${item.label}</span>
					<span class="st-optional" ?hidden=${!optionalLabel}>${optionalLabel}</span>
					<span class="st-desc" ?hidden=${!description}>${description}</span>
				</span>
			</button>
		</li>`;
	}
	stepKey(item, index) {
		return item.id ?? item.label ?? index;
	}
	render() {
		this.html`
			<ol class="stepper" data-orientation=${this.state.orientation} @click=${this.handleClick}>
				${this.list('items', this.stepRow, this.stepKey)}
			</ol>
		`;
	}
}
customElements.define('ui-stepper', UIStepper);
